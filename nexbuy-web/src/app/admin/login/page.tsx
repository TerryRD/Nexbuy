import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-10">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理員登入</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            輸入店家後台帳密。一般顧客請從首頁繼續瀏覽。
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
