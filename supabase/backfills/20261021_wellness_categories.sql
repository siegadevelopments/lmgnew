-- Wellness category backfill, reviewed 337 physical products (services left NULL).
-- Run AFTER supabase/migrations/20261021_product_wellness_categories.sql.
-- Only touches the product ids reviewed below; products added later stay NULL (keyword fallback).
BEGIN;

UPDATE public.products AS p
SET wellness_categories = v.cats
FROM (VALUES
  (259, ARRAY['womens-wellness']::text[]),
  (275, ARRAY['healthy-ageing']::text[]),
  (276, ARRAY['healthy-ageing']::text[]),
  (400, ARRAY['stress-management']::text[]),
  (401, ARRAY['gut-health']::text[]),
  (403, ARRAY['gut-health']::text[]),
  (404, ARRAY['gut-health']::text[]),
  (405, ARRAY['gut-health']::text[]),
  (406, ARRAY['womens-wellness']::text[]),
  (407, ARRAY['gut-health']::text[]),
  (408, ARRAY['gut-health']::text[]),
  (409, ARRAY['gut-health']::text[]),
  (411, ARRAY['sleep-recovery','stress-management']::text[]),
  (413, ARRAY['womens-wellness']::text[]),
  (414, ARRAY['womens-wellness']::text[]),
  (417, ARRAY['gut-health']::text[]),
  (421, ARRAY['stress-management','sleep-recovery']::text[]),
  (425, ARRAY['brain-health','stress-management']::text[]),
  (426, ARRAY['gut-health']::text[]),
  (523, ARRAY['womens-wellness']::text[]),
  (542, ARRAY['stress-management']::text[]),
  (543, ARRAY['stress-management']::text[]),
  (544, ARRAY['stress-management']::text[]),
  (545, ARRAY['stress-management']::text[]),
  (546, ARRAY['stress-management']::text[]),
  (547, ARRAY['stress-management']::text[]),
  (548, ARRAY['stress-management']::text[]),
  (549, ARRAY['stress-management']::text[]),
  (550, ARRAY['stress-management','sleep-recovery']::text[]),
  (551, ARRAY['stress-management','sleep-recovery']::text[]),
  (552, ARRAY['stress-management']::text[]),
  (553, ARRAY['stress-management']::text[]),
  (554, ARRAY['stress-management']::text[]),
  (555, ARRAY['stress-management']::text[]),
  (556, ARRAY['stress-management']::text[]),
  (557, ARRAY['stress-management']::text[]),
  (564, ARRAY['stress-management']::text[]),
  (565, ARRAY['stress-management']::text[]),
  (674, ARRAY['healthy-ageing']::text[]),
  (677, ARRAY['healthy-ageing']::text[]),
  (686, ARRAY['healthy-ageing']::text[]),
  (691, ARRAY['healthy-ageing']::text[]),
  (697, ARRAY['healthy-ageing']::text[]),
  (703, ARRAY['healthy-ageing']::text[]),
  (714, ARRAY['healthy-ageing']::text[]),
  (715, ARRAY['healthy-ageing']::text[]),
  (11501, ARRAY['healthy-ageing']::text[]),
  (11806, ARRAY['menopause-support','womens-wellness']::text[])
) AS v(id, cats)
WHERE p.id = v.id;

-- Reviewed and deliberately in no wellness category (makeup, perfume, cleaning, general skincare...)
UPDATE public.products
SET wellness_categories = '{}'::text[]
WHERE id IN (251,253,254,255,256,257,258,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,277,278,279,280,402,410,412,415,416,418,419,420,422,423,424,427,514,516,517,518,519,521,524,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,561,562,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649,650,651,652,653,654,655,656,657,658,659,660,661,662,663,664,665,666,667,668,669,670,671,672,673,675,676,678,679,680,681,682,683,684,685,687,688,689,690,692,693,694,695,696,698,699,700,701,702,704,705,706,707,708,709,710,711,712,713,716,717,718,719,720,721,723,11473,11497,11503,11505,11554,11559,11563,11566,11570,11574,11578,11582,11586,11590,11594,11678,11684,11687,11691,11693,11695,11697,11699,11701,11703,11705,11707,11721,11733,11738,11739,11742,11744,11746,11748,11750,11753,11755,11757,11759,11761,11763,11765,11767,11769,11771,11773,11775,11777,11779,11781,11783,11785,11787,11789,11791,11794,11796,11798,11800,11802,11804,11820,11822,11824,11826,11828,11830,11832,11834,11836,11838,11840,11842,11844,11846,11848,11850,11859);

COMMIT;

-- Check: counts per category
SELECT c AS category, count(*) FROM public.products, unnest(wellness_categories) AS c GROUP BY c ORDER BY 2 DESC;
