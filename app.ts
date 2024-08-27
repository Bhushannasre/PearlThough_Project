class EmailServiceTS {
    private retryCount = 3;
    private retryDelay = 1000;
    private idempotencyStore = new Set<string>();
    private statusTracker = new Map<string, string>();

    async sendWithRetry(email: EmailTS, provider: EmailProviderTS, attempt: number = 1): Promise<void> {
        try {
            await provider.send(email);
            this.statusTracker.set(email.id, 'Success');
        } catch (error) {
            if (attempt < this.retryCount) {
                setTimeout(() => this.sendWithRetry(email, provider, attempt + 1), this.retryDelay * Math.pow(2, attempt));
            } else {
                this.statusTracker.set(email.id, 'Failed');
                throw error;
            }
        }
    }

    async sendEmail(email: EmailTS): Promise<void> {
        if (this.idempotencyStore.has(email.id)) return;
        this.idempotencyStore.add(email.id);

        try {
            await this.sendWithRetry(email, new MockEmailProvider1TS());
        } catch {
            await this.sendWithRetry(email, new MockEmailProvider2TS());
        }
    }
}

class MockEmailProvider1TS implements EmailProviderTS {
    async send(email: EmailTS): Promise<void> {
        console.log("Sending email with Provider 1 (TS)");
        if (Math.random() > 0.7) {
            throw new Error("Provider 1 (TS) failed");
        }
    }
}

class MockEmailProvider2TS implements EmailProviderTS {
    async send(email: EmailTS): Promise<void> {
        console.log("Sending email with Provider 2 (TS)");
        if (Math.random() > 0.5) {
            throw new Error("Provider 2 (TS) failed");
        }
    }
}

// Interface definitions
interface EmailTS {
    id: string;
    to: string;
    subject: string;
    message: string;
}

interface EmailProviderTS {
    send(email: EmailTS): Promise<void>;
}

// Event listener for form submission
document.getElementById('emailForm')!.addEventListener('submit', function (event) {
    event.preventDefault();
    const emailService = new EmailServiceTS();
    const email: EmailTS = {
        id: Date.now().toString(),
        to: (document.getElementById('email') as HTMLInputElement).value,
        subject: (document.getElementById('subject') as HTMLInputElement).value,
        message: (document.getElementById('message') as HTMLTextAreaElement).value,
    };

    emailService.sendEmail(email)
        .then(() => {
            (document.getElementById('status') as HTMLDivElement).textContent = "Email sent successfully!";
        })
        .catch(() => {
            (document.getElementById('status') as HTMLDivElement).textContent = "Failed to send email.";
        });
});

