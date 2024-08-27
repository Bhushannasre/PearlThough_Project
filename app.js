class EmailServiceJS {
    constructor() {
        this.retryCount = 3;
        this.retryDelay = 1000;
        this.idempotencyStore = new Set();
        this.statusTracker = new Map();
    }

    async sendWithRetry(email, provider, attempt = 1) {
        try {
            await provider.send(email);
            this.statusTracker.set(email.id, 'Success');
        } catch (error) {
            if (attempt < this.retryCount) {
                setTimeout(() => this.sendWithRetry(email, provider, attempt + 1), this.retryDelay * Math.pow(2, attempt));
            } else {
                throw error;
            }
        }
    }

    async sendEmail(email) {
        if (this.idempotencyStore.has(email.id)) return;
        this.idempotencyStore.add(email.id);

        try {
            await this.sendWithRetry(email, new MockEmailProvider1JS());
        } catch {
            await this.sendWithRetry(email, new MockEmailProvider2JS());
        }
    }
}

class MockEmailProvider1JS {
    async send(email) {
        console.log("Sending email with Provider 1 (JS)");
        if (Math.random() > 0.7) {
            throw new Error("Provider 1 (JS) failed");
        }
    }
}

class MockEmailProvider2JS {
    async send(email) {
        console.log("Sending email with Provider 2 (JS)");
        if (Math.random() > 0.5) {
            throw new Error("Provider 2 (JS) failed");
        }
    }
}

// Event listener for form submission
document.getElementById('emailForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const emailService = new EmailServiceJS();
    const email = {
        id: Date.now().toString(),
        to: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
    };

    emailService.sendEmail(email)
        .then(() => {
            document.getElementById('status').textContent = "Email sent successfully!";
        })
        .catch(() => {
            document.getElementById('status').textContent = "Failed to send email.";
        });
});
