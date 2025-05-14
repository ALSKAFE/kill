import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertBooking, Booking, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";

// Extend booking schema with client-side validation
const bookingFormSchema = insertBookingSchema.extend({
  tenantName: z.string().min(1, "اسم المستأجر مطلوب"),
  phoneNumber: z.string().regex(/^(05)\d{8}$/, "يجب أن يبدأ رقم الهاتف بـ 05 ويتكون من 10 أرقام"),
  paid: z.coerce.number().min(0, "يجب أن تكون القيمة 0 أو أكبر"),
  remaining: z.coerce.number().min(0, "يجب أن تكون القيمة 0 أو أكبر"),
  peopleCount: z.coerce.number().min(1, "يجب أن يكون عدد الأشخاص 1 على الأقل"),
}).omit({ createdBy: true });

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSuccess: () => void;
  editBookingId?: number;
}

export default function BookingForm({ isOpen, onClose, selectedDate, onSuccess, editBookingId }: BookingFormProps) {
  const { user } = useAuth();
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  
  // Fetch existing bookings for the selected date
  const { data: dateBookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings/date', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/date/${selectedDate}`);
      if (!res.ok) throw new Error('فشل في استرجاع الحجوزات');
      return res.json();
    },
    enabled: isOpen
  });
  
  // Fetch booking details if editing
  const { data: editBooking } = useQuery<Booking>({
    queryKey: ['/api/bookings', editBookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${editBookingId}`);
      if (!res.ok) throw new Error('فشل في استرجاع بيانات الحجز');
      return res.json();
    },
    enabled: !!editBookingId && isOpen
  });
  
  // Update existing bookings state
  useEffect(() => {
    if (dateBookings) {
      setExistingBookings(dateBookings);
    }
  }, [dateBookings]);
  
  // Setup form with default values
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: selectedDate,
      period: "morning",
      tenantName: "",
      phoneNumber: "",
      paid: 0,
      remaining: 0,
      peopleCount: 1,
      notes: ""
    }
  });
  
  // Update form values if editing
  useEffect(() => {
    if (editBooking) {
      form.reset({
        date: editBooking.date,
        period: editBooking.period,
        tenantName: editBooking.tenantName,
        phoneNumber: editBooking.phoneNumber,
        paid: editBooking.paid,
        remaining: editBooking.remaining,
        peopleCount: editBooking.peopleCount,
        notes: editBooking.notes || ""
      });
    }
  }, [editBooking, form]);
  
  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema>) => {
      const bookingData: InsertBooking = {
        ...data,
        createdBy: user?.id || 0
      };
      
      const res = await apiRequest(
        "POST", 
        "/api/bookings", 
        bookingData
      );
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    }
  });
  
  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema>) => {
      const bookingData = {
        ...data,
        createdBy: user?.id || 0
      };
      
      const res = await apiRequest(
        "PUT", 
        `/api/bookings/${editBookingId}`, 
        bookingData
      );
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    }
  });
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    // Check for booking conflicts
    const conflictingBooking = existingBookings.find(booking => {
      // Skip the current booking if editing
      if (editBookingId && booking.id === editBookingId) return false;
      
      if (data.period === "both") {
        return ["morning", "evening", "both"].includes(booking.period);
      } else if (data.period === "morning") {
        return ["morning", "both"].includes(booking.period);
      } else if (data.period === "evening") {
        return ["evening", "both"].includes(booking.period);
      }
      return false;
    });
    
    if (conflictingBooking) {
      form.setError("period", { 
        type: "manual", 
        message: "هناك حجز موجود بالفعل في هذا التاريخ والفترة" 
      });
      return;
    }
    
    if (editBookingId) {
      updateBookingMutation.mutate(data);
    } else {
      createBookingMutation.mutate(data);
    }
  };
  
  // Check if mutation is in progress
  const isMutating = createBookingMutation.isPending || updateBookingMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="bg-primary px-6 py-4 -mx-6 -mt-6 rounded-t-lg flex justify-between items-center">
          <DialogTitle className="text-lg font-bold text-white">
            {editBookingId ? "تعديل حجز" : "إضافة حجز جديد"}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-white hover:bg-primary/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="mb-4 text-center">
          <div className="text-sm font-medium text-gray-500">التاريخ المختار</div>
          <div className="text-lg font-bold text-primary">{formatDate(selectedDate)}</div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفترة</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isMutating}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفترة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">صباحية</SelectItem>
                      <SelectItem value="evening">مسائية</SelectItem>
                      <SelectItem value="both">كامل اليوم</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستأجر</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المستأجر" {...field} disabled={isMutating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input 
                      dir="ltr" 
                      placeholder="05xxxxxxxx" 
                      {...field} 
                      disabled={isMutating} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدفوع</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          disabled={isMutating} 
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">﷼</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="remaining"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المتبقي</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          disabled={isMutating} 
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">﷼</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="peopleCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد الأشخاص</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1" 
                      min="1" 
                      {...field} 
                      disabled={isMutating} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل أي ملاحظات إضافية" 
                      rows={2} 
                      {...field} 
                      disabled={isMutating} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 mt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose} 
                disabled={isMutating}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isMutating}
              >
                {isMutating ? "جاري الحفظ..." : "حفظ الحجز"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
