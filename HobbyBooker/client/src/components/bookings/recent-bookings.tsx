import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatPeriod, formatCurrency, getPeriodBadgeColor } from "@/lib/utils";
import { Booking } from "@shared/schema";
import BookingForm from "./booking-form";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecentBookings() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Fetch recent bookings
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings?limit=10');
      if (!res.ok) throw new Error('فشل في استرجاع الحجوزات');
      return res.json();
    }
  });
  
  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ['/api/bookings']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/bookings/range']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/stats']
      });
      
      toast({
        title: "تم حذف الحجز",
        description: "تم حذف الحجز بنجاح",
        variant: "default",
      });
      
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف الحجز",
        description: error.message,
        variant: "destructive",
      });
      
      setIsDeleteDialogOpen(false);
    }
  });
  
  // Open edit form
  const openEditForm = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsFormOpen(true);
  };
  
  // Close edit form
  const closeEditForm = () => {
    setIsFormOpen(false);
    setSelectedBooking(null);
  };
  
  // Open delete dialog
  const openDeleteDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };
  
  // Delete booking
  const confirmDelete = () => {
    if (selectedBooking) {
      deleteBookingMutation.mutate(selectedBooking.id);
    }
  };
  
  // Handle booking form success
  const onBookingSuccess = () => {
    // Invalidate queries to refetch data
    queryClient.invalidateQueries({
      queryKey: ['/api/bookings']
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/bookings/range']
    });
    queryClient.invalidateQueries({
      queryKey: ['/api/stats']
    });
    
    toast({
      title: "تم تحديث الحجز",
      description: "تم تحديث بيانات الحجز بنجاح",
      variant: "default",
    });
    
    closeEditForm();
  };
  
  return (
    <>
      <Card className="mb-8 rounded-xl shadow-lg overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800">آخر الحجوزات</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اليوم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستأجر
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفترة
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدفوع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المتبقي
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عدد الأشخاص
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        جاري تحميل البيانات...
                      </div>
                    </td>
                  </tr>
                ) : bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.tenantName}</div>
                        <div className="text-sm text-gray-500 ltr">{booking.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPeriodBadgeColor(booking.period)}`}>
                          {formatPeriod(booking.period)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.remaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.peopleCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => openEditForm(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(booking)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="text-gray-500">لا توجد حجوزات</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {selectedBooking && isFormOpen && (
        <BookingForm 
          isOpen={isFormOpen}
          onClose={closeEditForm}
          selectedDate={selectedBooking.date}
          editBookingId={selectedBooking.id}
          onSuccess={onBookingSuccess}
        />
      )}
      
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الحجز؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الحجز نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
