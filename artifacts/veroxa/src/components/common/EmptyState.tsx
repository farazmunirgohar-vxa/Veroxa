import { FileText, Image as ImageIcon, ClipboardList, Bell, Workflow, type LucideIcon } from "lucide-react";

interface Props {
  icon?:    LucideIcon;
  title:    string;
  message?: string;
  testId?:  string;
}

export function EmptyState({ icon: Icon, title, message, testId }: Props) {
  const Display = Icon ?? FileText;
  return (
    <div
      className="rounded-md border border-dashed border-border bg-muted/10 px-4 py-6 text-center"
      data-testid={testId}
    >
      <Display className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
    </div>
  );
}

export const NoReports       = () => <EmptyState icon={FileText}      title="No reports yet"       message="Reports will appear here once published." testId="empty-reports" />;
export const NoContent       = () => <EmptyState icon={Workflow}      title="No content in flight" message="New content items will show here as they enter the pipeline." testId="empty-content" />;
export const NoMedia         = () => <EmptyState icon={ImageIcon}     title="No media uploaded"    message="Upload photos or videos to start." testId="empty-media" />;
export const NoTasks         = () => <EmptyState icon={ClipboardList} title="No open tasks"        message="You're all caught up." testId="empty-tasks" />;
export const NoNotifications = () => <EmptyState icon={Bell}          title="No notifications"     message="We'll let you know when something needs attention." testId="empty-notifications" />;
