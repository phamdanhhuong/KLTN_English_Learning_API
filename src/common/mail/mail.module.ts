import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
                    port: config.get<number>('MAIL_PORT', 587),
                    secure: false,
                    auth: {
                        user: config.get<string>('MAIL_USER'),
                        pass: config.get<string>('MAIL_PASS'),
                    },
                },
                defaults: {
                    from: config.get<string>(
                        'MAIL_FROM',
                        '"KLTN English Learning" <no-reply@kltn.dev>',
                    ),
                },
                template: {
                    dir: join(process.cwd(), 'src', 'common', 'mail', 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: { strict: true },
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
