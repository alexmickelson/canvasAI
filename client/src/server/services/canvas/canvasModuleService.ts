import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";
import { getLatestSyncJob } from "./canvasSnapshotService";

export const CanvasModuleItemSchema = z.object({
  id: z.number(),
  module_id: z.number(),
  position: z.number(),
  title: z.string(),
  indent: z.number(),
  type: z.string(),
  content_id: z.number().optional(),
  html_url: z.string(),
  url: z.string().optional(),
  page_url: z.string().optional(),
  external_url: z.string().optional(),
  new_tab: z.boolean().optional(),
  completion_requirement: z.record(z.unknown()).optional(),
  content_details: z.record(z.unknown()).optional(),
  published: z.boolean().optional(),
});
export type CanvasModuleItem = z.infer<typeof CanvasModuleItemSchema>;
export const CanvasModuleSchema = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  unlock_at: z.string().nullable().optional(),
  require_sequential_progress: z.boolean(),
  publish_final_grade: z.boolean(),
  published: z.boolean(),
  items: z.array(CanvasModuleItemSchema).optional(),
});

export type CanvasModule = z.infer<typeof CanvasModuleSchema>;

async function getAllModulesInCourse(
  courseId: number
): Promise<CanvasModule[]> {
  console.log("getting modules for course", courseId);
  return paginatedRequest<CanvasModule[]>({
    url: canvasApi + `/courses/${courseId}/modules`,
    params: {
      include: "items",
    },
  });
}

export async function storeModuleInDatabase(
  module: CanvasModule,
  courseId: number,
  syncJobId: number
) {
  console.log("storing module in database", module.name, courseId, syncJobId);
  const validated = CanvasModuleSchema.parse(module);
  await db.none(
    `insert into modules (
      id,
      name,
      position,
      unlock_at,
      require_sequential_progress,
      publish_final_grade,
      published,
      course_id,
      sync_job_id,
      original_record
    ) values (
      $<id>,
      $<name>,
      $<position>,
      $<unlock_at>,
      $<require_sequential_progress>,
      $<publish_final_grade>,
      $<published>,
      $<course_id>,
      $<sync_job_id>,
      $<json>
    ) on conflict (id) do update
    set 
      name = excluded.name,
      position = excluded.position,
      unlock_at = excluded.unlock_at,
      require_sequential_progress = excluded.require_sequential_progress,
      publish_final_grade = excluded.publish_final_grade,
      published = excluded.published,
      course_id = excluded.course_id,
      sync_job_id = excluded.sync_job_id,
      original_record = excluded.original_record`,
    {
      id: validated.id,
      name: validated.name,
      position: validated.position,
      unlock_at: validated.unlock_at,
      require_sequential_progress: validated.require_sequential_progress,
      publish_final_grade: validated.publish_final_grade,
      published: validated.published,
      course_id: courseId,
      sync_job_id: syncJobId,
      json: module,
    }
  );

  if (validated.items && validated.items.length > 0) {
    for (const item of validated.items) {
      await storeModuleItemInDatabase(item, syncJobId);
    }
  } else {
    console.log(
      "no items in module, not storing in database",
      validated.id,
      validated.name
    );
  }
}
export async function getModulesFromDatabase(
  courseId: number,
  syncJobId?: number
): Promise<CanvasModule[]> {
  const latestSyncId = syncJobId ? syncJobId : (await getLatestSyncJob()).id;
  const rows = await db.any<{ json: CanvasModule }>(
    `select original_record as json
     from modules
     where course_id = $<courseId>
       and sync_job_id = $<syncJobId>
     order by id`,
    { courseId, syncJobId: latestSyncId }
  );
  return rows.map((row) => row.json);
}

export async function syncModulesForCourse(
  courseId: number,
  syncJobId: number
) {
  const modules = await getAllModulesInCourse(courseId);
  console.log("got modules from canvas", modules.length);
  await Promise.all(
    modules.map(async (module) => {
      await storeModuleInDatabase(module, courseId, syncJobId);
    })
  );
}

export async function getAllModuleItemsInModule(
  courseId: number,
  moduleId: number
): Promise<CanvasModuleItem[]> {
  return paginatedRequest<CanvasModuleItem[]>({
    url: canvasApi + `/courses/${courseId}/modules/${moduleId}/items`,
    params: { include: "content_details" },
  });
}

export async function storeModuleItemInDatabase(
  item: CanvasModuleItem,
  syncJobId?: number
) {
  const validated = CanvasModuleItemSchema.parse(item);
  await db.none(
    `insert into module_items (
      id,
      module_id,
      position,
      title,
      indent,
      type,
      content_id,
      html_url,
      url,
      page_url,
      external_url,
      new_tab,
      completion_requirement,
      content_details,
      published,
      sync_job_id,
      original_record
    ) values (
      $<id>,
      $<module_id>,
      $<position>,
      $<title>,
      $<indent>,
      $<type>,
      $<content_id>,
      $<html_url>,
      $<url>,
      $<page_url>,
      $<external_url>,
      $<new_tab>,
      $<completion_requirement>,
      $<content_details>,
      $<published>,
      $<sync_job_id>,
      $<json>
    ) on conflict (id) do update set
      module_id = excluded.module_id,
      position = excluded.position,
      title = excluded.title,
      indent = excluded.indent,
      type = excluded.type,
      content_id = excluded.content_id,
      html_url = excluded.html_url,
      url = excluded.url,
      page_url = excluded.page_url,
      external_url = excluded.external_url,
      new_tab = excluded.new_tab,
      completion_requirement = excluded.completion_requirement,
      content_details = excluded.content_details,
      published = excluded.published,
      sync_job_id = excluded.sync_job_id,
      original_record = excluded.original_record`,
    {
      id: validated.id,
      module_id: validated.module_id,
      position: validated.position,
      title: validated.title,
      indent: validated.indent,
      type: validated.type,
      content_id: validated.content_id,
      html_url: validated.html_url,
      url: validated.url,
      page_url: validated.page_url,
      external_url: validated.external_url,
      new_tab: validated.new_tab,
      completion_requirement: validated.completion_requirement,
      content_details: validated.content_details,
      published: validated.published,
      sync_job_id: syncJobId,
      json: item,
    }
  );
}
