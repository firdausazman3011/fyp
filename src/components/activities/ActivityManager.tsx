"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityStatus } from "@prisma/client";
import { fetchCsrfToken } from "@/lib/client-security";
import { uploadImageToStorage } from "@/lib/upload-image";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { AppImage } from "@/components/ui/AppImage";
import { isActivityCompleted } from "@/lib/activity-time";
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/date-format";
import type { FieldErrors } from "@/lib/form-errors";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError } from "@/components/ui/field-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  timeLabel: string;
  durationMinutes: number;
  participantLimit: number;
  location: string;
  organizer: string;
  imageUrl: string;
  status: ActivityStatus;
  participantCount: number;
  attendanceCount: number;
};

type ActivityDetail = {
  id: string;
  title: string;
  participants: Array<{ id: string; name: string; email: string }>;
  attendance: Array<{ id: string; name: string; email: string; confirmedAt: string }>;
};

type ActivityManagerProps = {
  activities: ActivityItem[];
  initialEditId?: string | null;
  initialFocusId?: string | null;
  sourceSuggestion?: { id: string; title: string; description: string; date: string; location: string } | null;
};

export function ActivityManager({ activities, initialEditId = null, initialFocusId = null, sourceSuggestion = null }: ActivityManagerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "COMPLETED" | "CANCELLED">("ACTIVE");
  const [items, setItems] = useState(activities);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    durationMinutes: "120",
    participantLimit: 50,
    location: "",
    organizer: "",
    imageUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, ActivityDetail>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const sortedItems = useMemo(() => {
    const computed = items.map((item) => {
      const completed = isActivityCompleted(new Date(item.date), item.timeLabel, item.durationMinutes);
      const normalizedStatus =
        item.status === ActivityStatus.CANCELLED ? "CANCELLED" : completed ? "COMPLETED" : "ACTIVE";
      return { ...item, normalizedStatus };
    });
    const filtered = computed.filter((item) => {
      return item.normalizedStatus === statusFilter;
    });
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [items, statusFilter]);
  const detailActivity = sortedItems.find((item) => item.id === detailActivityId) ?? null;

  useEffect(() => {
    if (!initialEditId) return;
    const target = activities.find((activity) => activity.id === initialEditId);
    if (target) {
      fillForm(target);
    }
  }, [activities, initialEditId]);

  useEffect(() => {
    if (!initialFocusId) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(`admin-activity-${initialFocusId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [initialFocusId]);

  useEffect(() => {
    if (!sourceSuggestion) return;
    setEditingId(null);
    setShowForm(true);
    setForm({
      title: sourceSuggestion.title,
      description: sourceSuggestion.description,
      date: sourceSuggestion.date.slice(0, 10),
      time: "",
      durationMinutes: "120",
      participantLimit: 50,
      location: sourceSuggestion.location,
      organizer: "",
      imageUrl: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sourceSuggestion]);

  async function openDetail(activityId: string) {
    setDetailActivityId(activityId);
    setDetailError(null);

    if (detailCache[activityId]) {
      return;
    }

    setDetailLoading(true);
    try {
      const response = await fetch(`/api/activities/${activityId}`, { cache: "no-store" });
      const data = (await response.json()) as { error?: string; activity?: ActivityDetail };
      if (!response.ok || !data.activity) {
        setDetailError(data.error ?? "Unable to load activity details.");
        return;
      }
      setDetailCache((current) => ({ ...current, [activityId]: data.activity! }));
    } catch {
      setDetailError("Unable to load activity details.");
    } finally {
      setDetailLoading(false);
    }
  }

  function fillForm(activity: ActivityItem) {
    setEditingId(activity.id);
    setShowForm(true);
    setForm({
      title: activity.title,
      description: activity.description,
      date: activity.date.slice(0, 10),
      time: activity.timeLabel,
      durationMinutes: String(activity.durationMinutes),
      participantLimit: activity.participantLimit,
      location: activity.location,
      organizer: activity.organizer,
      imageUrl: activity.imageUrl,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setFieldErrors({});
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      durationMinutes: "120",
      participantLimit: 50,
      location: "",
      organizer: "",
      imageUrl: "",
    });
    setShowForm(false);
  }

  function closeForm() {
    resetForm();
    if (sourceSuggestion?.id) {
      router.push(`/admin/suggestions?focus=${sourceSuggestion.id}`);
      return;
    }
    router.replace("/admin/activities");
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImageToStorage(file);
      setForm((current) => ({ ...current, imageUrl }));
      showToast("Image uploaded successfully.", "success");
    } catch (uploadError) {
      showToast(uploadError instanceof Error ? uploadError.message : "Unable to upload image.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    const durationValue = Number(form.durationMinutes);
    const nextErrors: FieldErrors = {};

    if (durationValue < 15) {
      nextErrors.durationMinutes = "Value must be greater than or equal to 15.";
    }
    if (!form.imageUrl.trim()) {
      nextErrors.imageUrl = "Please upload an activity image before saving.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setFieldErrors({ title: "Unable to save activity." });
      return;
    }

    const submittedForm = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      durationMinutes: durationValue,
      participantLimit: Number(form.participantLimit),
      location: form.location.trim(),
      organizer: form.organizer.trim(),
      imageUrl: form.imageUrl.trim(),
    };

    const endpoint = editingId ? `/api/activities/${editingId}` : "/api/activities";
    const method = editingId ? "PATCH" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        ...submittedForm,
        sourceSuggestionId: !editingId ? sourceSuggestion?.id : undefined,
        status: editingId ? items.find((item) => item.id === editingId)?.status ?? "PUBLISHED" : "PUBLISHED",
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string; fieldErrors?: FieldErrors; activity?: ActivityItem };
    if (!response.ok || !data.activity) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors);
        return;
      }
      setFieldErrors({ title: data.error ?? "Unable to save activity." });
      return;
    }

    const normalizedActivity: ActivityItem = {
      ...data.activity,
      title: submittedForm.title,
      description: submittedForm.description,
      date: submittedForm.date,
      timeLabel: submittedForm.time,
      durationMinutes: submittedForm.durationMinutes,
      participantLimit: submittedForm.participantLimit,
      location: submittedForm.location,
      organizer: submittedForm.organizer,
      imageUrl: submittedForm.imageUrl,
    };

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === normalizedActivity.id ? normalizedActivity : item)));
      showToast("Activity updated successfully.", "success");
    } else {
      setItems((current) => [normalizedActivity, ...current]);
      showToast("Activity created successfully.", "success");
    }
    resetForm();
    router.replace(`/admin/activities?focus=${data.activity.id}`);
  }

  async function onDelete(id: string) {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to delete activity.", "error");
      return;
    }

    const response = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to delete activity.", "error");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    showToast(data.message ?? "Activity deleted successfully.", "success");
    resetForm();
    setDeleteId(null);
  }

  async function onCancelActivity(activity: ActivityItem) {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to update activity.", "error");
      return;
    }

    const response = await fetch(`/api/activities/${activity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        title: activity.title,
        description: activity.description,
        date: activity.date.slice(0, 10),
        time: activity.timeLabel,
        durationMinutes: activity.durationMinutes,
        participantLimit: activity.participantLimit,
        location: activity.location,
        organizer: activity.organizer,
        imageUrl: activity.imageUrl,
        status: "CANCELLED",
      }),
    });

    const data = (await response.json()) as { activity?: ActivityItem; error?: string; message?: string };
    if (!response.ok || !data.activity) {
      showToast(data.error ?? "Unable to update activity.", "error");
      return;
    }

    setItems((current) => current.map((item) => (item.id === data.activity?.id ? data.activity : item)));
    showToast("Activity cancelled.", "success");
  }

  return (
    <div className="page-stack">
      <div className="flex items-center">
        {!showForm ? (
          <Button type="button" onClick={() => setShowForm(true)}>
            Add New Activity
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto shadow-lg">
            <form onSubmit={onSubmit} className="flex flex-col">
              <CardHeader className="flex flex-col gap-4 border-b bg-muted/30 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle>{editingId ? "Edit Activity" : "Add New Activity"}</CardTitle>
                  <CardDescription>Rule enforced: admin can add, edit, and delete activity data from one place.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={closeForm}>
                  {editingId ? "Cancel Edit" : "Close"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-title">Activity Title</Label>
                    <Input
                      id="activity-title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter activity title"
                      required
                    />
                    <FieldError message={fieldErrors.title} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-organizer">Organizer</Label>
                    <Input
                      id="activity-organizer"
                      value={form.organizer}
                      onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                      placeholder="Enter organizer name"
                      required
                    />
                    <FieldError message={fieldErrors.organizer} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-description">Description</Label>
                  <Textarea
                    id="activity-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter activity description"
                    rows={4}
                    required
                  />
                  <FieldError message={fieldErrors.description} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="activity-date">Date</Label>
                    <Input id="activity-date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" required />
                    <FieldError message={fieldErrors.date} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-time">Time</Label>
                    <Input id="activity-time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} type="time" required />
                    <FieldError message={fieldErrors.time} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationMinutes">Duration (Minutes)</Label>
                    <Input
                      id="durationMinutes"
                      name="durationMinutes"
                      value={form.durationMinutes}
                      onChange={(e) => {
                        e.target.setCustomValidity("");
                        setForm({ ...form, durationMinutes: e.target.value.replace(/[^0-9]/g, "") });
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                    />
                    <FieldError message={fieldErrors.durationMinutes} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participant-limit">Participant Limit</Label>
                    <Input
                      id="participant-limit"
                      value={form.participantLimit}
                      onChange={(e) => setForm({ ...form, participantLimit: Number(e.target.value) })}
                      type="number"
                      min={1}
                      step={1}
                      required
                    />
                    <FieldError message={fieldErrors.participantLimit} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-location">Location</Label>
                  <Input
                    id="activity-location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Enter location"
                    required
                  />
                  <FieldError message={fieldErrors.location} />
                </div>

                <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-4">
                  <Label className="text-base">Activity image</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rule enforced: activities require an image; upload directly from your laptop. Supported types: `.png`, `.jpg`, `.jpeg`, `.webp`,
                    `.gif`, `.bmp`, `.svg`.
                  </p>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
                    onChange={onFileChange}
                    className="mt-3 cursor-pointer"
                  />
                  {uploading ? <p className="mt-2 text-sm text-primary">Uploading image...</p> : null}
                  {form.imageUrl ? <p className="mt-2 text-xs text-muted-foreground">Uploaded: {form.imageUrl}</p> : null}
                  <FieldError message={fieldErrors.imageUrl} />
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button type="submit">{editingId ? "Save Activity" : "Add Activity"}</Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      ) : null}

      <div className="filter-stack">
        <div className="flex flex-wrap gap-2">
          {(["ACTIVE", "COMPLETED", "CANCELLED"] as const).map((filter) => (
            <Button key={filter} type="button" variant={statusFilter === filter ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(filter)}>
              {filter[0] + filter.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        <div className="content-grid">
        {sortedItems.map((activity) => (
          <Card id={`admin-activity-${activity.id}`} key={activity.id} className="overflow-hidden shadow-sm">
            <div className="aspect-video w-full bg-muted">
              <AppImage src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover" />
            </div>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 text-lg font-semibold leading-tight pr-2">{activity.title}</h3>
                {activity.normalizedStatus === "CANCELLED" ? (
                  <Badge variant="destructive" className="ml-auto shrink-0">
                    Cancelled
                  </Badge>
                ) : activity.normalizedStatus === "COMPLETED" ? (
                  <Badge variant="muted" className="ml-auto shrink-0">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="success" className="ml-auto shrink-0">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>Date: {formatDateDDMMYYYY(activity.date)}</p>
                  <p>Time: {activity.timeLabel}</p>
                  <p>Duration: {activity.durationMinutes} mins</p>
                  <p>
                    Slots: {activity.participantCount}/{activity.participantLimit}{" "}
                    {activity.participantCount >= activity.participantLimit ? "(Full)" : "(Open)"}
                  </p>
                  <p>Location: {activity.location}</p>
                  <p>Organizer: {activity.organizer}</p>
                  <Button type="button" variant="outline" size="sm" className="justify-start text-left font-normal" onClick={() => void openDetail(activity.id)}>
                    Participants: {activity.participantCount}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="justify-start text-left font-normal" onClick={() => void openDetail(activity.id)}>
                    Attendance: {activity.attendanceCount}
                  </Button>
                </div>
              <div className="flex flex-wrap gap-2">
                {activity.normalizedStatus === "ACTIVE" ? (
                  <Button type="button" size="sm" onClick={() => fillForm(activity)}>
                    Edit
                  </Button>
                ) : null}
                {activity.normalizedStatus === "ACTIVE" && activity.participantCount > 0 ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setCancelId(activity.id)}>
                    Cancel
                  </Button>
                ) : null}
                {activity.normalizedStatus === "ACTIVE" && activity.participantCount === 0 ? (
                  <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteId(activity.id)}>
                    Delete
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedItems.length === 0 ? (
          <EmptyState message="No activities available at the moment. Stay tuned for upcoming events." className="col-span-full" />
        ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Activity"
        description="This activity will be removed permanently. Do you want to continue?"
        confirmLabel="Delete Activity"
        tone="danger"
        onConfirm={() => {
          if (deleteId) {
            void onDelete(deleteId);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={cancelId !== null}
        title="Cancel Activity"
        description="This activity will be marked as cancelled and cannot be resumed. Continue?"
        confirmLabel="Cancel Activity"
        tone="danger"
        onConfirm={() => {
          const target = items.find((item) => item.id === cancelId);
          if (target) void onCancelActivity(target);
          setCancelId(null);
        }}
        onCancel={() => setCancelId(null)}
      />
      {detailActivity ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-2xl">{detailActivity.title}</CardTitle>
                <CardDescription className="mt-1">Joined users and attendance details for this activity.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setDetailActivityId(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Participants</h3>
                <div className="mt-3 space-y-2">
                  {detailLoading && !detailCache[detailActivity.id] ? (
                    <p className="text-sm text-muted-foreground">Loading participants...</p>
                  ) : detailError ? (
                    <p className="text-sm text-destructive">{detailError}</p>
                  ) : detailCache[detailActivity.id]?.participants.length ? (
                    detailCache[detailActivity.id].participants.map((participant) => (
                      <div key={participant.id} className="rounded-lg border bg-muted/30 px-4 py-3">
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">{participant.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No participants yet.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attendance</h3>
                <div className="mt-3 space-y-2">
                  {detailLoading && !detailCache[detailActivity.id] ? (
                    <p className="text-sm text-muted-foreground">Loading attendance...</p>
                  ) : detailError ? (
                    <p className="text-sm text-destructive">{detailError}</p>
                  ) : detailCache[detailActivity.id]?.attendance.length ? (
                    detailCache[detailActivity.id].attendance.map((record) => (
                      <div key={`${record.id}-${record.confirmedAt}`} className="rounded-lg border bg-muted/30 px-4 py-3">
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-muted-foreground">{record.email}</p>
                        <p className="text-xs text-muted-foreground">Signed at: {formatDateTimeDDMMYYYY(record.confirmedAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No attendance signed yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
