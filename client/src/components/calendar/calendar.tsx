import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Booking, CalendarDay } from "@shared/schema";
import BookingForm from "@/components/bookings/booking-form";
import { DateTime } from "luxon";
import { ChevronRight, ChevronLeft, CalendarPlus, Printer } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { formatDate, getDayBackgroundColor, getCalendarDays, getPeriodBadgeColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  
  // Fetch bookings for the current month
  const startDate = currentDate.startOf('month').toISODate() as string;
  const endDate = currentDate.endOf('month').toISODate() as string;
  
  const { data: bookingsData, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings/range', startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/range?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('فشل في استرجاع الحجوزات');
      return res.json();
    }
  });
  
  // Update calendar days when date or bookings change
  useEffect(() => {
    const year = currentDate.year;
    const month = currentDate.month - 1; // JavaScript months are 0-indexed
    
    const days = getCalendarDays(year, month);
    
    // Populate days with booking info
    if (bookingsData) {
      bookingsData.forEach(booking => {
        const dayIndex = days.findIndex(day => day.date === booking.date);
        if (dayIndex !== -1) {
          if (booking.period === 'morning' || booking.period === 'both') {
            days[dayIndex].bookings.morning = booking;
          }
          if (booking.period === 'evening' || booking.period === 'both') {
            days[dayIndex].bookings.evening = booking;
          }
        }
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, bookingsData]);
  
  // Change month
  const changeMonth = (offset: number) => {
    setCurrentDate(currentDate.plus({ months: offset }));
  };
  
  // Open booking form
  const openBookingForm = (date?: string) => {
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(DateTime.now().toISODate() as string);
    }
    setIsFormOpen(true);
  };
  
  // Close booking form
  const closeBookingForm = () => {
    setIsFormOpen(false);
  };
  
  // Handle booking form submission success
  const onBookingSuccess = () => {
    // Invalidate queries to refetch data
    queryClient.invalidateQueries({
      queryKey: ['/api/bookings/range', startDate, endDate]
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/bookings']
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/stats']
    });
    
    toast({
      title: "تم الحجز بنجاح",
      description: "تم حفظ بيانات الحجز",
      variant: "default",
    });
    
    closeBookingForm();
  };
  
  // Handle print calendar
  const handlePrintCalendar = () => {
    window.print();
  };
  
  return (
    <>
      <Card className="mb-8 rounded-xl shadow-lg overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">تقويم الحجز</CardTitle>
            <div className="flex space-x-2 space-x-reverse mt-2 sm:mt-0">
              <Button onClick={() => openBookingForm()} className="inline-flex items-center">
                <CalendarPlus className="ml-2 h-4 w-4" />
                إضافة حجز جديد
              </Button>
              <Button variant="outline" onClick={handlePrintCalendar} className="print:hidden">
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => changeMonth(-1)}
              className="text-primary flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold text-gray-800">
              {currentDate.setLocale('ar').toFormat('MMMM yyyy')}
            </h2>
            <Button 
              variant="ghost" 
              onClick={() => changeMonth(1)}
              className="text-primary flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
            <div className="py-2">أحد</div>
            <div className="py-2">إثنين</div>
            <div className="py-2">ثلاثاء</div>
            <div className="py-2">أربعاء</div>
            <div className="py-2">خميس</div>
            <div className="py-2">جمعة</div>
            <div className="py-2">سبت</div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div key={index} className="aspect-w-1 aspect-h-1">
                <div 
                  className={`h-24 sm:h-28 md:h-32 p-1 rounded-lg shadow-sm 
                              transition-all duration-200 flex flex-col overflow-hidden cursor-pointer
                              ${getDayBackgroundColor(day.bookings)}
                              ${!day.isCurrentMonth ? 'opacity-50' : ''}`}
                  onClick={() => openBookingForm(day.date)}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-bold text-lg ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}`}>
                      {day.day}
                    </span>
                    <div className="flex space-x-1 space-x-reverse">
                      {day.bookings.morning && day.bookings.evening && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-200 text-green-800 rounded">كامل</span>
                      )}
                      {day.bookings.morning && !day.bookings.evening && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">صباحاً</span>
                      )}
                      {!day.bookings.morning && day.bookings.evening && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">مساءً</span>
                      )}
                    </div>
                  </div>
                  
                  {(day.bookings.morning || day.bookings.evening) && (
                    <div className="mt-auto text-xs">
                      <div className="truncate font-medium text-gray-900">
                        {day.bookings.morning?.tenantName || day.bookings.evening?.tenantName}
                      </div>
                      <div className="truncate text-gray-500 ltr">
                        {day.bookings.morning?.phoneNumber || day.bookings.evening?.phoneNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <div className="flex space-x-6 space-x-reverse">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded ml-2"></div>
                <span className="text-sm text-gray-600">متاح</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded ml-2"></div>
                <span className="text-sm text-gray-600">حجز جزئي</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded ml-2"></div>
                <span className="text-sm text-gray-600">حجز كامل</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isFormOpen && selectedDate && (
        <BookingForm 
          isOpen={isFormOpen} 
          onClose={closeBookingForm} 
          selectedDate={selectedDate}
          onSuccess={onBookingSuccess}
        />
      )}
    </>
  );
}
