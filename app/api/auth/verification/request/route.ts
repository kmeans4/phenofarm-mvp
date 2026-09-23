import { NextRequest } from 'next/server';
import { requestPublicAccountLink } from '@/lib/account-security-api';
export const runtime = 'nodejs';
export function POST(request: NextRequest) { return requestPublicAccountLink(request, 'VERIFY_EMAIL'); }
