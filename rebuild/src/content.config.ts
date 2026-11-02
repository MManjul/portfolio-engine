import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    studio: z.string(),
    role: z.string(),
    engine: z.string(),
    platforms: z.string(),
    badge: z.string().optional(),
    summary: z.string(),
    order: z.number(),
    cover: image().optional(),
    gallery: z.array(image()).default([]),
    trailer: z.string().url().optional(),
    stack: z.array(z.string()),
    caseStudy: z.boolean().default(false),
    results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  }),
});

export const collections = { projects };
