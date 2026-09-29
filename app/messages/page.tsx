import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ growerId?: string; productId?: string }>;
}) {
  const session = await getAuthSession();
  const params = await searchParams;
  if (!session)
    redirect(
      `/auth/sign_in?callbackUrl=${encodeURIComponent('/messages?' + new URLSearchParams(params))}`
    );
  const query = new URLSearchParams({
    messages: '1',
    ...(params.growerId ? { chatGrower: params.growerId } : {}),
    ...(params.productId ? { chatProduct: params.productId } : {}),
  });
  redirect(`/${session.user.role.toLowerCase()}/dashboard?${query}`);
}
