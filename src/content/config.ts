import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    image: z.string().optional(),
  }),
});

export const gameCBlogCollections = <const>{
  game: blogCollection,
};

export const techBlocgCollections = <const>{
  tech: blogCollection,
};
