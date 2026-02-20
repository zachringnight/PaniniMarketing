import { createServiceClient } from "@/lib/supabase/server";
import type { Asset } from "@/lib/types";

interface SendNotificationParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email notification via SMTP.
 * In development, logs to console. In production, calls Supabase Edge Function.
 */
async function sendEmail({ to, subject, html }: SendNotificationParams) {
  const supabase = createServiceClient();

  // Invoke Supabase Edge Function for sending email
  const { error } = await supabase.functions.invoke("send-notification", {
    body: { to, subject, html },
  });

  if (error) {
    console.error("Failed to send notification email:", error);
  }
}

/**
 * Notify approvers that a new asset is ready for review.
 */
export async function notifyApproversOfNewReview(assetId: string) {
  const supabase = createServiceClient();

  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const asset = assetRow as unknown as Asset | null;
  if (!asset) return;

  const { data: approvalsRaw } = await supabase
    .from("approvals")
    .select("*, user:users(*)")
    .eq("asset_id", assetId)
    .eq("status", "pending");

  if (!approvalsRaw) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const approval of approvalsRaw) {
    const user = (approval as unknown as { user: { email: string; full_name: string } }).user;
    await sendEmail({
      to: user.email,
      subject: `Review Requested: ${asset.title}`,
      html: buildReviewRequestEmail({
        recipientName: user.full_name,
        assetTitle: asset.title,
        dueDate: asset.approval_due
          ? new Date(asset.approval_due).toLocaleDateString()
          : "No deadline set",
        reviewUrl: `${appUrl}/content/${assetId}`,
      }),
    });
  }
}

/**
 * Notify admin of an approval status change.
 */
export async function notifyAdminOfApprovalChange(
  assetId: string,
  approverName: string,
  action: string,
  comment?: string
) {
  const supabase = createServiceClient();

  const { data: assetRow } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const asset = assetRow as unknown as Asset | null;
  if (!asset) return;

  // Fetch the creator's info separately
  const { data: adminRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", asset.created_by)
    .single();

  const admin = adminRow as unknown as { email: string; full_name: string } | null;
  if (!admin) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await sendEmail({
    to: admin.email,
    subject: `${approverName} ${action} "${asset.title}"`,
    html: buildStatusChangeEmail({
      recipientName: admin.full_name,
      assetTitle: asset.title,
      approverName,
      action,
      comment,
      assetUrl: `${appUrl}/content/${assetId}`,
    }),
  });
}

// Email template builders

function buildReviewRequestEmail(params: {
  recipientName: string;
  assetTitle: string;
  dueDate: string;
  reviewUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Review Requested</h2>
      <p>Hi ${params.recipientName},</p>
      <p>A new asset has been submitted for your review:</p>
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600;">${params.assetTitle}</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Due: ${params.dueDate}</p>
      </div>
      <a href="${params.reviewUrl}" style="display: inline-block; background: #1a1a2e; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
        Review Now
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">Partnership Hub</p>
    </div>
  `;
}

function buildStatusChangeEmail(params: {
  recipientName: string;
  assetTitle: string;
  approverName: string;
  action: string;
  comment?: string;
  assetUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Approval Update</h2>
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.approverName}</strong> ${params.action} <strong>"${params.assetTitle}"</strong>.</p>
      ${
        params.comment
          ? `<div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">"${params.comment}"</p>
            </div>`
          : ""
      }
      <a href="${params.assetUrl}" style="display: inline-block; background: #1a1a2e; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
        View Asset
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">Partnership Hub</p>
    </div>
  `;
}
