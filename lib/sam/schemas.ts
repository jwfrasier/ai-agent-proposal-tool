import { z } from 'zod';

export const SamOpportunityRawSchema = z
  .object({
    noticeId: z.string(),
    title: z.string(),
    fullParentPathName: z.string().optional().default(''),
    naicsCode: z.string().nullish(),
    typeOfSetAsideDescription: z.string().nullish(),
    postedDate: z.string().nullish(),
    responseDeadLine: z.string().nullish(),
    awardCeiling: z.union([z.string(), z.number()]).nullish(),
    placeOfPerformance: z
      .object({
        city: z.object({ name: z.string() }).partial().optional(),
        state: z.object({ code: z.string() }).partial().optional(),
      })
      .nullish(),
    description: z.string().nullish(),
    uiLink: z.string().url().nullish(),
  })
  .passthrough();

export const SamSearchResponseSchema = z.object({
  totalRecords: z.number(),
  limit: z.number(),
  offset: z.number(),
  opportunitiesData: z.array(SamOpportunityRawSchema),
});

export type SamOpportunityRaw = z.infer<typeof SamOpportunityRawSchema>;
export type SamSearchResponse = z.infer<typeof SamSearchResponseSchema>;
