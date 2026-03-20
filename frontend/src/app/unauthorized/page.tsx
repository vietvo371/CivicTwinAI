import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 bg-card/50 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-destructive/5 blur-[100px] pointer-events-none" />
        
        <CardHeader className="flex flex-col items-center gap-4 text-center z-10 relative">
          <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center shadow-inner">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold font-heading uppercase tracking-wide">
              Từ Chối Truy Cập
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Tài khoản của bạn không có đặc quyền để truy cập phân vùng này. Nếu đây là sự nhầm lẫn, vui lòng liên hệ Ban quản trị.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="z-10 relative">
          <Link href="/login" className="block w-full">
            <Button className="w-full uppercase tracking-widest font-bold" size="lg" variant="secondary">
              Quay lại Đăng Nhập
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
