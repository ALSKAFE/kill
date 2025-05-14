import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  
  // Get user initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "N/A";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">نظام حجز الشقة</h1>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {user && (
              <>
                <span 
                  className="px-3 py-1 bg-secondary text-white text-xs rounded-full"
                >
                  {user.role === "admin" ? "مدير" : "مستخدم"}
                </span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2 space-x-reverse focus:outline-none"
                    >
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                      <Avatar className="h-8 w-8 bg-primary">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-48 mt-1 p-0">
                    <div className="py-1">
                      <button className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        الملف الشخصي
                      </button>
                      <button className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        الإعدادات
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
