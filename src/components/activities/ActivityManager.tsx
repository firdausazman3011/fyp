"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityStatus } from "@prisma/client";
import { fetchCsrfToken } from "@/lib/client-security";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { AppImage } from "@/components/ui/AppImage";
import { isActivityCompleted } from "@/lib/activity-time";

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
  participants: Array<{ id: string; name: string; email: string }>;
  attendance: Array<{ id: string; name: string; email: string; confirmedAt: string }>;
};

type ActivityManagerProps = {
  activities: ActivityItem[];
  initialEditId?: string | null;
  initialFocusId?: string | null;
  sourceSuggestion?: { id: string; title: string; description: string; date: string; location: string } | null;
};

async function uploadImage(file: File) {
  const csrfToken = await fetchCsrfToken();
  if (!csrfToken) {
    throw new Error("Unable to upload image.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: formData,
  });
  const data = (await response.json()) as { imageUrl?: string; error?: string };
  if (!response.ok || !data.imageUrl) {
    throw new Error(data.error ?? "Upload failed.");
  }
  return data.imageUrl;
}

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
  const [showForm, setShowForm] = useState(false);

  const sortedItems = useMemo(() => {
    const computed = items.map((item) => {
      const completed = isActivityCompleted(new Date(item.date), item.timeLabel, item.durationMinutes);
      const normalizedStatus =
        item.status === ActivityStatus.CANCELLED
          ? "CANCELLED"
          : completed
            ? "COMPLETED"
            : "ACTIVE";
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
      const imageUrl = await uploadImage(file);
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
    const formElement = event.currentTarget;
    const durationInput = formElement.elements.namedItem("durationMinutes") as HTMLInputElement | null;
    const durationValue = Number(form.durationMinutes);
    if (durationValue < 15) {
      if (durationInput) {
        durationInput.setCustomValidity("Value must be greater than or equal to 15.");
        durationInput.reportValidity();
      }
      return;
    }
    if (durationInput) {
      durationInput.setCustomValidity("");
    }
    if (!form.imageUrl.trim()) {
      showToast("Please upload an activity image before saving.", "error");
      return;
    }

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to save activity.", "error");
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

    const data = (await response.json()) as { message?: string; error?: string; activity?: ActivityItem };
    if (!response.ok || !data.activity) {
      showToast(data.error ?? "Unable to save activity.", "error");
      return;
    }

    const normalizedActivity: ActivityItem = {
      ...data.activity,
      title: submittedForm.title,
      description: submittedForm.description,
      date: new Date(`${submittedForm.date}T${submittedForm.time}:00`).toISOString(),
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
    router.refresh();
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
    router.refresh();
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
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {!showForm ? (
          <button type="button" onClick={() => setShowForm(true)} className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
            Add New Activity
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ACTIVE", "COMPLETED", "CANCELLED"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${statusFilter === filter ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}
          >
            {filter[0] + filter.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {showForm ? (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto space-y-4 rounded-3xl border-2 border-[#6b4f3a] bg-white p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <h2 className="text-xl font-semibold text-textPrimary">{editingId ? "Edit Activity" : "Add New Activity"}</h2>
            <p className="text-sm text-textSecondary">
              Rule enforced: admin can add, edit, and delete activity data from one place.
            </p>
          </div>
          {editingId ? (
            <button type="button" onClick={closeForm} className="rounded-full border border-borderUi px-4 py-2 text-sm">
              Cancel Edit
            </button>
          ) : (
            <button type="button" onClick={closeForm} className="rounded-full border border-borderUi px-4 py-2 text-sm">
              Close
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Activity Title:</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter activity title" className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Organizer:</label>
            <input
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              placeholder="Enter organizer name"
              className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm font-medium text-textPrimary"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textPrimary">Description:</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter activity description" rows={4} className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm" required />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Date:</label>
            <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Time:</label>
            <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} type="time" className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Duration (Minutes):</label>
            <input
              name="durationMinutes"
              value={form.durationMinutes}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setForm({ ...form, durationMinutes: e.target.value.replace(/[^0-9]/g, "") });
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Participant Limit:</label>
            <input
              value={form.participantLimit}
              onChange={(e) => setForm({ ...form, participantLimit: Number(e.target.value) })}
              type="number"
              min={1}
              step={1}
              className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-textPrimary">Location:</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Enter location" className="w-full rounded-2xl border border-primary/20 bg-rose-50 px-4 py-3 text-sm" required />
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-primary/30 bg-rose-50/40 p-4">
          <label className="block text-sm font-medium text-textPrimary">Activity image</label>
          <p className="mt-1 text-xs text-textSecondary">
            Rule enforced: activities require an image; upload directly from your laptop. Supported types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.svg`.
          </p>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml"
            onChange={onFileChange}
            className="mt-3 block w-full text-sm"
          />
          {uploading ? <p className="mt-2 text-sm text-primary">Uploading image...</p> : null}
          {form.imageUrl ? <p className="mt-2 text-xs text-textSecondary">Uploaded: {form.imageUrl}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
            {editingId ? "Save Activity" : "Add Activity"}
          </button>
        </div>
      </form>
      </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedItems.map((activity) => (
          <article id={`admin-activity-${activity.id}`} key={activity.id} className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-md">
              <div className="h-44 w-full bg-mainBg">
                <AppImage src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4 p-4 sm:p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-textPrimary">{activity.title}</h3>
                  {activity.normalizedStatus === "CANCELLED" ? (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-primary">Cancelled</span>
                  ) : activity.normalizedStatus === "COMPLETED" ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Completed</span>
                  ) : (
                    <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
                  )}
                </div>
                <p className="text-sm text-textSecondary">{activity.description}</p>
                <div className="grid gap-1 text-sm text-textSecondary sm:grid-cols-2">
                  <p>Date: {new Date(activity.date).toLocaleDateString()}</p>
                  <p>Time: {activity.timeLabel}</p>
                  <p>Duration: {activity.durationMinutes} mins</p>
                  <p>
                    Slots: {activity.participantCount}/{activity.participantLimit}{" "}
                    {activity.participantCount >= activity.participantLimit ? "(Full)" : "(Open)"}
                  </p>
                  <p>Location: {activity.location}</p>
                  <p>Organizer: {activity.organizer}</p>
                  <button type="button" onClick={() => setDetailActivityId(activity.id)} className="rounded-full border border-black px-3 py-1 text-left text-xs font-semibold text-black">
                    Participants: {activity.participantCount}
                  </button>
                  <button type="button" onClick={() => setDetailActivityId(activity.id)} className="rounded-full border border-black px-3 py-1 text-left text-xs font-semibold text-black">
                    Attendance: {activity.attendanceCount}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.normalizedStatus === "ACTIVE" ? (
                  <button type="button" onClick={() => fillForm(activity)} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                    Edit
                  </button>
                ) : null}
                {activity.normalizedStatus === "ACTIVE" && activity.participantCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCancelId(activity.id)}
                    className="rounded-full border border-black px-4 py-2 text-sm font-medium text-black"
                  >
                    Cancel
                  </button>
                ) : null}
                {activity.normalizedStatus === "ACTIVE" && activity.participantCount === 0 ? (
                  <button type="button" onClick={() => setDeleteId(activity.id)} className="rounded-full bg-statusRejected px-4 py-2 text-sm font-medium text-white">
                    Delete
                  </button>
                ) : null}
              </div>
              </div>
          </article>
        ))}
      </div>
      {sortedItems.length === 0 ? (
        <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">
          No activities available at the moment. Stay tuned for upcoming events.
        </p>
      ) : null}
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
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary">{detailActivity.title}</h2>
                <p className="mt-1 text-sm text-textSecondary">Joined users and attendance details for this activity.</p>
              </div>
              <button type="button" onClick={() => setDetailActivityId(null)} className="rounded-full border border-borderUi px-4 py-2 text-sm font-medium">
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-textPrimary">Participants</h3>
                <div className="mt-3 space-y-3">
                  {detailActivity.participants.length ? (
                    detailActivity.participants.map((participant) => (
                      <div key={participant.id} className="rounded-2xl bg-mainBg px-4 py-3">
                        <p className="font-medium text-textPrimary">{participant.name}</p>
                        <p className="text-sm text-textSecondary">{participant.email}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-textSecondary">No participants yet.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-textPrimary">Attendance</h3>
                <div className="mt-3 space-y-3">
                  {detailActivity.attendance.length ? (
                    detailActivity.attendance.map((record) => (
                      <div key={`${record.id}-${record.confirmedAt}`} className="rounded-2xl bg-mainBg px-4 py-3">
                        <p className="font-medium text-textPrimary">{record.name}</p>
                        <p className="text-sm text-textSecondary">{record.email}</p>
                        <p className="text-xs text-textSecondary">Signed at: {new Date(record.confirmedAt).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-textSecondary">No attendance signed yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
