import React from "react";
import { Bell, BellOff } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

/**
 * A dropdown row that lets a user enable/disable browser push notifications.
 * Renders nothing on browsers without push support. Keeps the menu open on
 * click so the user sees the resulting toast.
 */
const PushNotificationToggle: React.FC = () => {
  const { supported, subscribed, loading, permission, subscribe, unsubscribe } =
    usePushNotifications();
  const { toast } = useToast();

  if (!supported) return null;

  const handleClick = async (e: Event) => {
    e.preventDefault();
    if (subscribed) {
      const ok = await unsubscribe();
      if (ok) toast({ title: "Notifications turned off" });
      return;
    }

    if (permission === "denied") {
      toast({
        title: "Notifications are blocked",
        description:
          "Enable notifications for this site in your browser settings, then try again.",
        variant: "destructive",
      });
      return;
    }

    const ok = await subscribe();
    toast(
      ok
        ? { title: "Notifications enabled", description: "You'll get updates on new batches and offers." }
        : {
            title: "Couldn't enable notifications",
            description: "Permission was not granted.",
            variant: "destructive",
          }
    );
  };

  return (
    <DropdownMenuItem
      onSelect={handleClick}
      disabled={loading}
      className="px-5 py-3.5 cursor-pointer hover:bg-[#f9fafb]"
    >
      {subscribed ? (
        <BellOff className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
      ) : (
        <Bell className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
      )}
      <span className="text-[16px] font-medium">
        {subscribed ? "Turn off notifications" : "Enable notifications"}
      </span>
    </DropdownMenuItem>
  );
};

export default PushNotificationToggle;
