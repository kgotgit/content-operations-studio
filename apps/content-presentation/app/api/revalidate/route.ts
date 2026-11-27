import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getRevalidationSecret } from '@/lib/env';

/**
 * On-demand cache invalidation webhook handler for Smartling and Sanity.
 * Triggers instant revalidation across Vercel Edge CDN without full redeployment.
 *
 * Auth: `REVALIDATION_SECRET` via `Authorization: Bearer <secret>`, `?secret=`, or `{ "secret" }`.
 */
export async function POST(request: NextRequest) {
  try {
    const expectedSecret = getRevalidationSecret();
    if (!expectedSecret) {
      return NextResponse.json(
        { message: 'REVALIDATION_SECRET is not configured for this deployment' },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const secret = bearer || request.nextUrl.searchParams.get('secret') || body.secret;

    if (secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid or missing secret' }, { status: 401 });
    }

    const { experience, locale, channel, menuType = 'global' } = body;

    // 1. Tag-based invalidation with cacheLife profile
    revalidateTag('navigation', 'max');
    if (experience && locale) {
      revalidateTag(`nav-${experience}-${menuType}-${locale}`, 'max');
      revalidateTag(`nav-${experience}-utility-${locale}`, 'max');
      revalidateTag(`nav-${experience}-section-${locale}`, 'max');
    }

    // 2. Path-based invalidation for edge-cached remote component
    if (channel && experience && locale) {
      revalidatePath(`/remote/navigation/${channel}/${experience}/${locale}`);
      revalidatePath(`/${locale}/${experience}`);
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      details: { channel, experience, locale },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error triggering revalidation', error: String(error) },
      { status: 500 },
    );
  }
}
