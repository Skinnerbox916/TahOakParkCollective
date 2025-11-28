import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withRole } from '@/lib/api-helpers';
import { ROLE } from '@/lib/prismaEnums';
import { getTranslationService, SupportedLocale } from '@/lib/translate';

export async function POST(request: NextRequest) {
  // Only allow admins and business owners to use translation API
  return withRole([ROLE.ADMIN, ROLE.ENTITY_OWNER], async () => {
    try {
      const body = await request.json();
      const { text, targetLocale, sourceLocale = 'en' } = body;

      if (!text || !targetLocale) {
        return createErrorResponse('text and targetLocale are required', 400);
      }

      if (!['en', 'es'].includes(targetLocale) || !['en', 'es'].includes(sourceLocale)) {
        return createErrorResponse('Invalid locale. Supported: en, es', 400);
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

