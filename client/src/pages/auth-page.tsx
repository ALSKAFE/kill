import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Redirect } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { InsertUser } from "@shared/schema";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
  remember: z.boolean().optional(),
});

// Register form schema
const registerFormSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يحتوي على ٣ أحرف على الأقل" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تحتوي على ٦ أحرف على الأقل" }),
  name: z.string().min(1, { message: "الاسم مطلوب" }),
});

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: z.infer<typeof loginFormSchema>) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  // Handle register form submission
  const onRegisterSubmit = (data: z.infer<typeof registerFormSchema>) => {
    const userData: InsertUser = {
      username: data.username,
      password: data.password,
      name: data.name,
      role: "user", // Default role
    };
    registerMutation.mutate(userData);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-lg overflow-hidden shadow-xl">
        <div className="w-full lg:w-1/2 bg-white p-6 md:p-8">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary">تسجيل الدخول</h2>
                <p className="text-gray-600 mt-1">للوصول إلى نظام حجز الشقة</p>
              </div>
              
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <FormField
                      control={loginForm.control}
                      name="remember"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox 
                            id="remember" 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                          <label 
                            htmlFor="remember" 
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            تذكرني
                          </label>
                        </div>
                      )}
                    />
                    
                    <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark">
                      نسيت كلمة المرور؟
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : null}
                    تسجيل الدخول
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary">إنشاء حساب جديد</h2>
                <p className="text-gray-600 mt-1">انضم إلى نظام حجز الشقة</p>
              </div>
              
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسمك الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : null}
                    إنشاء حساب
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="hidden lg:block lg:w-1/2 bg-primary text-white p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">نظام حجز الشقة</h1>
            <p className="mt-2 text-lg opacity-90">
              نظام متكامل لإدارة حجوزات الشقة بكفاءة وسهولة
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                <i className="fas fa-calendar-check text-white"></i>
              </div>
              <div className="mr-4">
                <h3 className="font-semibold text-lg">إدارة الحجوزات</h3>
                <p className="opacity-80">إدارة حجوزات الشقة من خلال تقويم تفاعلي وسهل الاستخدام</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                <i className="fas fa-clock text-white"></i>
              </div>
              <div className="mr-4">
                <h3 className="font-semibold text-lg">حجز مرن</h3>
                <p className="opacity-80">إمكانية حجز الشقة للفترة الصباحية أو المسائية أو كامل اليوم</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                <i className="fas fa-chart-line text-white"></i>
              </div>
              <div className="mr-4">
                <h3 className="font-semibold text-lg">إحصائيات مفصلة</h3>
                <p className="opacity-80">متابعة حجوزات اليوم والأسبوع وإجمالي المدفوعات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
