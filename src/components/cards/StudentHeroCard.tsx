import type { Student } from "@/lib/dummy/data";
import { Chip } from "@/components/common/Section";
import { dismissalTime, schoolName } from "@/lib/dummy/data";

export function StudentHeroCard({ students }: { students: Student[] }) {
  return (
    <div className="mx-5 overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
          Daftar Peserta Didik
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {schoolName}
        </span>
      </div>

      {students.map((student, index) => (
        <div key={student.id}>
          {index > 0 && <div className="my-5 border-t border-white/15" />}

          {/* ===================== SISWA ===================== */}
          <div className={index === 0 ? "mt-5 flex items-center gap-4" : "flex items-center gap-4"}>
            <div
              className="grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl font-bold text-white shadow-glow"
              style={{ backgroundColor: student.avatarColor }}
            >
              {student.nickname ? student.nickname[0] : student.name[0]}
            </div>

            <div className="min-w-0">
              {student.className ? (
                <p className="text-[11px] uppercase tracking-wider text-white/70">
                  Kelas {student.className}
                </p>
              ) : null}
              <h2 className="mt-[-3px] truncate font-display text-2xl font-bold">
                {student.name}
              </h2>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="success" className="bg-white/20 text-white">
              Jam Kepulangan : {dismissalTime}
            </Chip>
            {student.dismissStatus === "sudah" ? (
              <Chip tone="success" className="bg-success/40 text-white">
                Sudah presensi pulang
              </Chip>
            ) : (
              <Chip tone="warning" className="bg-destructive/40 text-white">
                Belum presensi pulang
              </Chip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

