import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";

export interface CanvasModuleItem {
  id: number;
  module_id: number;
  position: number;
  title: string;
  indent: number;
  type: string;
  content_id?: number;
  html_url: string;
  url?: string;
  page_url?: string;
  external_url?: string;
  new_tab?: boolean;
  completion_requirement?: {
    type: string;
    min_score?: number;
    completed: boolean;
  };
  content_details?: {
    points_possible?: number;
    due_at?: string;
    unlock_at?: string;
    lock_at?: string;
  };
  published?: boolean;
}

export interface CanvasModule {
  id: number;
  name: string;
  position: number;
  unlock_at?: string;
  require_sequential_progress: boolean;
  publish_final_grade: boolean;
  published: boolean;
  items?: CanvasModuleItem[];
}

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
  courseId: number
) {
  console.log("storing module in database", module.name, courseId);
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
      original_record = excluded.original_record`,
    {
      id: module.id,
      name: module.name,
      position: module.position,
      unlock_at: module.unlock_at,
      require_sequential_progress: module.require_sequential_progress,
      publish_final_grade: module.publish_final_grade,
      published: module.published,
      course_id: courseId,
      json: module,
    }
  );
}

export async function getModulesFromDatabase(
  courseId: number
): Promise<CanvasModule[]> {
  const rows = await db.any<{ json: CanvasModule }>(
    `select original_record as json
     from modules
     where course_id = $<courseId>
     order by id`,
    { courseId }
  );
  return rows.map((row) => row.json);
}

export async function syncModulesForCourse(courseId: number) {
  const modules = await getAllModulesInCourse(courseId);
  console.log("got modules from canvas", modules.length);
  await Promise.all(
    modules.map(async (module) => {
      await storeModuleInDatabase(module, courseId);
    })
  );
}
