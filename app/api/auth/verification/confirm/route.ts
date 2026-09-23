import { NextRequest } from 'next/server';
import { completeAccountAction } from '@/lib/account-security-api';
export const runtime = 'nodejs';
export function POST(request: NextRequest) { return completeAccountAction(request, 'VERIFY_EMAIL'); }
