import { Kafka, EachMessagePayload } from 'kafkajs';
import nodemailer from 'nodemailer';

const kafka = new Kafka({
  clientId: 'forgot-password-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'forgot-password-group' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const runForgotPasswordConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'forgot-password-topic', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      const { to, subject, html } = JSON.parse(message.value?.toString() || '{}');

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to,
          subject,
          html,
        });

        console.log(`✅ Password reset email sent to: ${to}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
      }
    },
  });
};

export default runForgotPasswordConsumer;
