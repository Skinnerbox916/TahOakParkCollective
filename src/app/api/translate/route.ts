import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withAuth } from '@/lib/api-helpers';
import { managesAnyEntity } from '@/lib/entities';
import { ROLE } from '@/lib/prismaEnums';
import { getTranslationService, isTranslationConfigured, SupportedLocale } from '@/lib/translate';

export async function POST(request: NextRequest) {
  // Admins, and people who manage at least one listing
  return withAuth(async (user) => {
    try {
      if (!user.roles.includes(ROLE.ADMIN) && !(await managesAnyEntity(user.id))) {
        return createErrorResponse('Forbidden', 403);
      }
      const body = await request.json();
      const { text, targetLocale, sourceLocale = 'en' } = body;

      if (!text || !targetLocale) {
        return createErrorResponse('text and targetLocale are required', 400);
      }

      if (!['en', 'es'].includes(targetLocale) || !['en', 'es'].includes(sourceLocale)) {
        return createErrorResponse('Invalid locale. Supported: en, es', 400);
      }

      if (!isTranslationConfigured()) {
        return createErrorResponse('Machine translation is not configured', 503);
      }

      const service = getTranslationService();
      const translated = await service.translate(
        text,
        targetLocale as SupportedLocale,
        sourceLocale as SupportedLocale
      );

      return createSuccessResponse({
        original: text,
        translated,
        sourceLocale,
        targetLocale,
      });
    } catch (error) {
      console.error('Translation error:', error);
      return createErrorResponse('Translation failed', 500);
    }
  });
}

