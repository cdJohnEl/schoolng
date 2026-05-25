import { GraduationCap } from "lucide-react";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">SchoolNG</span>
          </div>
          <p className="text-sm text-muted-foreground">Complete school management platform</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Students · Fees · Attendance · Results · Report cards
        </p>
      </div>
    </div>
  );
}
