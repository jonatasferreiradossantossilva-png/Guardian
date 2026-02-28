
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-incident-reports.ts';
import '@/ai/flows/optimize-route-ai-assistant.ts';
import '@/ai/flows/optimizeSchoolVanRoute.ts';
import '@/ai/flows/generate-monthly-invoices.ts';
import '@/ai/flows/geocode-address.ts';
import '@/ai/flows/routing-geoapify.ts';
import '@/ai/flows/validate-api-keys.ts';
