import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { recordUserActivity } from "@/lib/activity";
import {
    validatePrayerCreate,
    validatePrayerUpdate,
    validatePrayerReport
} from "@/lib/prayers/moderation";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();

        // 1. Enforce authentication on all prayer endpoints (no anonymous scraping)
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "Authentication required to access The Altar and prayer wall."
            }, { status: 401 });
        }

        const url = new URL(req.url);
        const feed = url.searchParams.get("feed");
        const supabase = getSupabaseServerClient();

        if (feed === "community") {
            // Fetch public community prayers with privacy-safe field selection
            // Exclude prayers that are marked private or have been reported by the community
            const { data, error } = await supabase
                .from('prayers')
                .select('id, title, description, is_community, author_name, status, prayed_count, scripture_ref, created_at, answered_at, testimony, user_id')
                .eq('is_community', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Community prayers fetch error:", error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            // Mask user_id to prevent tracking while allowing author self-identification
            const sanitized = (data || []).map((p: any) => ({
                ...p,
                is_author: p.user_id === userId,
                user_id: undefined // Don't expose other users' account IDs
            }));

            return NextResponse.json({ success: true, data: sanitized });
        }

        // Default: Fetch authenticated user's own prayers
        const { data, error } = await supabase
            .from('prayers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("User prayers fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (e: any) {
        console.error("Error in GET /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to fetch prayers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // 1. Validate prayer input schema and affirmative community consent
        const validation = validatePrayerCreate(body);
        if (!validation.isValid) {
            return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
        }

        const {
            title,
            description,
            is_community = false,
            author_name,
            ai_strategy,
            scripture_ref
        } = body;

        const safeIsCommunity = Boolean(is_community);

        const supabase = getSupabaseServerClient();

        // Ensure user profile exists
        await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'Believer',
                email: clerkUser?.emailAddresses?.[0]?.emailAddress || ''
            }, { onConflict: 'id', ignoreDuplicates: true });

        // Sanitize author name
        const safeAuthorName = (author_name && typeof author_name === 'string')
            ? author_name.slice(0, 50).trim()
            : (clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName?.[0] ? clerkUser.lastName[0] + '.' : ''}` : 'Fellow Believer');

        const { data, error } = await supabase
            .from('prayers')
            .insert({
                user_id: userId,
                title: title.trim(),
                description: description ? description.trim() : null,
                is_community: safeIsCommunity,
                author_name: safeAuthorName,
                status: 'active',
                ai_strategy: ai_strategy || null,
                scripture_ref: scripture_ref || null,
                prayed_count: 0
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating prayer:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Record user activity for streak
        await recordUserActivity(userId);

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        console.error("Error in POST /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to create prayer" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, action } = body;

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();

        // Community Moderation Reporting Action
        if (action === 'report') {
            const reason = (typeof body.reason === 'string' && body.reason.trim())
                ? body.reason.trim().slice(0, 500)
                : 'Inappropriate or sensitive content';

            // Attempt atomic stored procedure execution first
            const { data: rpcData, error: rpcErr } = await supabase.rpc('report_community_prayer', {
                p_prayer_id: id,
                p_reporter_id: userId,
                p_reason: reason
            });

            if (!rpcErr) {
                return NextResponse.json({
                    success: true,
                    message: "Petition reported and removed from the community prayer wall. A durable moderation record has been logged for review.",
                    report_id: rpcData?.report_id
                });
            }

            // Translate known RPC error codes
            const errMsg = rpcErr.message || '';
            if (errMsg.includes('NOT_FOUND')) {
                return NextResponse.json({ success: false, error: "Petition not found" }, { status: 404 });
            }
            if (errMsg.includes('NOT_PUBLIC')) {
                return NextResponse.json({
                    success: false,
                    error: "Only active public community petitions can be reported."
                }, { status: 400 });
            }
            if (errMsg.includes('SELF_REPORT')) {
                return NextResponse.json({
                    success: false,
                    error: "You cannot report your own petition. Use 'Make Private' to unpublish it."
                }, { status: 400 });
            }
            if (errMsg.includes('DUPLICATE_REPORT') || rpcErr.code === '23505') {
                return NextResponse.json({
                    success: false,
                    error: "You have already submitted a report for this petition."
                }, { status: 409 });
            }

            // Fallback for environments where RPC might not be present:
            // 1. Fetch target prayer and validate
            const { data: targetPrayer, error: fetchErr } = await supabase
                .from('prayers')
                .select('id, user_id, title, is_community')
                .eq('id', id)
                .single();

            if (fetchErr || !targetPrayer) {
                return NextResponse.json({ success: false, error: "Petition not found" }, { status: 404 });
            }

            const reportValidation = validatePrayerReport(targetPrayer, userId, reason);
            if (!reportValidation.isValid) {
                return NextResponse.json({ success: false, error: reportValidation.error }, { status: 400 });
            }

            // 2. CRITICAL AUDIT REQUIREMENT: Persist durable moderation report record FIRST.
            // Never unpublish or claim success if the moderation audit log insert fails!
            const { data: insertedReport, error: reportInsertErr } = await supabase
                .from('prayer_moderation_reports')
                .insert({
                    prayer_id: id,
                    reporter_id: userId,
                    reason,
                    status: 'pending_review',
                    prayer_title_snapshot: targetPrayer.title,
                    reported_user_id_snapshot: targetPrayer.user_id
                })
                .select('id')
                .single();

            if (reportInsertErr) {
                if (reportInsertErr.code === '23505' || reportInsertErr.message?.includes('duplicate key')) {
                    return NextResponse.json({
                        success: false,
                        error: "You have already submitted a report for this petition."
                    }, { status: 409 });
                }
                console.error("Durable moderation log insert failed:", reportInsertErr);
                return NextResponse.json({
                    success: false,
                    error: "Failed to record moderation report. Petition was not unpublished."
                }, { status: 500 });
            }

            // 3. ONLY after durable report is recorded, unpublish the prayer from the community wall
            const { error: unpublishErr } = await supabase
                .from('prayers')
                .update({ is_community: false })
                .eq('id', id)
                .eq('is_community', true);

            if (unpublishErr) {
                console.error("Error unpublishing reported prayer:", unpublishErr);
                return NextResponse.json({ success: false, error: unpublishErr.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "Petition reported and removed from the community prayer wall. A durable moderation record has been logged for review.",
                report_id: insertedReport?.id
            });
        }

        // Author Updates (status, testimony, unpublish / publish)
        const updateValidation = validatePrayerUpdate(body);
        if (!updateValidation.isValid) {
            return NextResponse.json({ success: false, error: updateValidation.error }, { status: 400 });
        }

        const { status, testimony, is_community } = body;
        const updates: any = {};
        if (status) {
            updates.status = status;
            if (status === 'answered') {
                updates.answered_at = new Date().toISOString();
            }
        }
        if (testimony !== undefined) {
            updates.testimony = typeof testimony === 'string' ? testimony.slice(0, 3000) : null;
        }
        if (is_community !== undefined) {
            updates.is_community = Boolean(is_community);
        }

        const { data, error } = await supabase
            .from('prayers')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Enforce ownership
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({
                success: false,
                error: error?.message || "Petition not found or you are not authorized to edit this petition."
            }, { status: 403 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || "Failed to update petition" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: "Valid prayer ID required" }, { status: 400 });
        }

        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('prayers')
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Enforce ownership

        if (error) {
            console.error("Error deleting prayer:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error in DELETE /api/prayers:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
