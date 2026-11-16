import type { ILead } from "./models/Lead";

/**
 * Stub function / hook point for external WhatsApp and Zoom automations.
 * In production, this can dispatch to:
 * - WhatsApp Business Cloud API / Wati / Interakt to send Zoom link message
 * - Zoom API to register attendee to a recurring webinar
 * - CRM sync (HubSpot, LeadSquared, etc.)
 */
export async function triggerLeadAutomations(lead: Partial<ILead>): Promise<void> {
  try {
    // Stub logging for automation trigger
    console.log(`[automation-stub] Triggering WhatsApp & Zoom delivery for lead:`, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      partnerSlug: lead.partnerSlug,
      partnerName: lead.partnerName,
      timestamp: new Date().toISOString(),
    });

    // TODO: Wire up WhatsApp Cloud API or Zoom API webhook here
  } catch (error) {
    console.error("[automation-stub] Failed to fire lead automations:", error);
  }
}
