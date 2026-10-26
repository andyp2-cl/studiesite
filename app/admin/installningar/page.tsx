import { AdminHeader } from "@/components/admin/admin-header";
import { SiteSettingsForm } from "@/components/admin/user-forms";
import { getSiteSettings } from "@/lib/admin/settings-data";
import { strings } from "@/lib/strings";

const t = strings.admin.settings;

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <AdminHeader kicker={strings.admin.nav.settings} title={strings.admin.nav.settings} intro={t.intro} />
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10 sm:px-8">
        <SiteSettingsForm initial={settings} />
        <p className="font-mono text-[11px] text-muted-foreground">{t.spent(settings.spentUsd.toFixed(2))}</p>
      </div>
    </main>
  );
}
