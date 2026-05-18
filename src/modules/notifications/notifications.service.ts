import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from '../../database/entities/push-subscription.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(PushSubscription)
        private readonly subscriptionRepo: Repository<PushSubscription>,
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
        const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
        const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:support@kollabary.com';

        if (!publicKey || !privateKey) {
            this.logger.warn('VAPID credentials missing in Environment configuration! Push notifications will not be active.');
            return;
        }

        try {
            webpush.setVapidDetails(subject, publicKey, privateKey);
            this.logger.log('VAPID details successfully configured for Push Notifications.');
        } catch (error) {
            this.logger.error('Failed to set VAPID details:', error);
        }
    }

    async registerSubscription(userId: string, subscriptionDto: any, userAgent: string) {
        if (!subscriptionDto || !subscriptionDto.endpoint || !subscriptionDto.keys) {
            throw new Error('Invalid subscription payload structure');
        }

        // Upsert subscription based on unique endpoint to prevent duplicates
        let sub = await this.subscriptionRepo.findOne({ where: { endpoint: subscriptionDto.endpoint } });
        if (!sub) {
            sub = new PushSubscription();
            sub.endpoint = subscriptionDto.endpoint;
        }

        sub.userId = userId;
        sub.p256dh = subscriptionDto.keys.p256dh;
        sub.auth = subscriptionDto.keys.auth;
        sub.userAgent = userAgent;

        return this.subscriptionRepo.save(sub);
    }

    async unregisterSubscription(endpoint: string) {
        if (!endpoint) return;
        await this.subscriptionRepo.delete({ endpoint });
    }

    async sendPushToUser(userId: string, payload: { title: string; body: string; url?: string; icon?: string }) {
        const subscriptions = await this.subscriptionRepo.find({ where: { userId } });
        
        if (subscriptions.length === 0) {
            this.logger.debug(`No active push subscriptions found for user ID: ${userId}`);
            return;
        }

        const promises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            };

            try {
                const message = JSON.stringify({
                    title: payload.title,
                    body: payload.body,
                    url: payload.url || '/',
                    icon: payload.icon || '/icons/icon-192x192.png',
                });
                
                await webpush.sendNotification(pushSubscription, message);
                this.logger.log(`Push notification sent successfully to user ${userId} on subscription ${sub.id}`);
            } catch (err: any) {
                // If endpoint is expired or gone (HttpStatus 410 or 404), prune it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    this.logger.warn(`Subscription expired or gone (Status ${err.statusCode}). Pruning subscription ID ${sub.id}`);
                    await this.subscriptionRepo.delete(sub.id);
                } else {
                    this.logger.error(`Failed to send notification to sub ${sub.id} for user ${userId}:`, err);
                }
            }
        });

        await Promise.all(promises);
    }
}
