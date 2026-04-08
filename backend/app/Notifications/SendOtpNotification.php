<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $otp;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $otp)
    {
        $this->otp = $otp;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Mã xác thực cấp lại mật khẩu (OTP) - CivicTwinAI')
            ->greeting('Xin chào ' . $notifiable->name . '!,')
            ->line('Hệ thống đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn.')
            ->line('Dưới đây là mã OTP 6 số của bạn:')
            ->line(new \Illuminate\Support\HtmlString('<div style="text-align: center; margin: 20px 0;"><span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px; letter-spacing: 5px; color: #1f2937;">' . $this->otp . '</span></div>'))
            ->line('Lưu ý: Mã này chỉ có hiệu lực trong vòng 5 phút.')
            ->line('Vui lòng KHÔNG chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn bảo mật.')
            ->line('Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email bưc thư này, tài khoản của bạn vẫn an toàn.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
