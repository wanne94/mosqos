/**
 * Announcement Factory
 * Creates announcement records with multi-language support
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDateTime, subMonths, addDays, randomDateBetween } from '../../generators/temporal/date-ranges.js';

type Announcement = Database['public']['Tables']['announcements']['Insert'];

const STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
const PRIORITIES = ['normal', 'important', 'urgent'] as const;
const AUDIENCES = ['all', 'members', 'specific_groups'] as const;

const CATEGORIES = [
  'General',
  'Events',
  'Classes',
  'Prayer Times',
  'Community News',
  'Fundraising',
  'Youth',
  'Sisters',
  'Brothers',
  'Ramadan',
  'Eid',
];

const ANNOUNCEMENT_TEMPLATES = [
  {
    title: {
      en: 'Jummah Prayer Time Change',
      ar: 'تغيير وقت صلاة الجمعة',
      tr: 'Cuma Namazı Vakti Değişikliği',
    },
    content: {
      en: 'Dear community members, please note that starting next week, Jummah prayer will begin at 1:30 PM instead of 1:00 PM. The khutbah will start at 1:15 PM. Please plan accordingly.',
      ar: 'أعضاء المجتمع الكرام، يرجى ملاحظة أنه ابتداءً من الأسبوع القادم، ستبدأ صلاة الجمعة في الساعة 1:30 مساءً بدلاً من 1:00 مساءً. ستبدأ الخطبة في الساعة 1:15 مساءً.',
      tr: 'Değerli cemaat üyeleri, gelecek haftadan itibaren Cuma namazının saat 13:00 yerine 13:30\'da başlayacağını bilgilerinize sunarız. Hutbe saat 13:15\'te başlayacaktır.',
    },
    category: 'Prayer Times',
    priority: 'important',
  },
  {
    title: {
      en: 'New Quran Classes Starting',
      ar: 'بدء دروس القرآن الجديدة',
      tr: 'Yeni Kuran Dersleri Başlıyor',
    },
    content: {
      en: 'We are excited to announce new Quran memorization classes for children ages 7-12. Classes will be held every Saturday from 10 AM to 12 PM. Registration is now open!',
      ar: 'يسعدنا الإعلان عن فصول جديدة لحفظ القرآن للأطفال من سن 7-12 سنة. ستعقد الفصول كل يوم سبت من الساعة 10 صباحًا حتى 12 ظهرًا. التسجيل مفتوح الآن!',
      tr: '7-12 yaş arası çocuklar için yeni Kuran ezberleme derslerini duyurmaktan mutluluk duyuyoruz. Dersler her Cumartesi saat 10:00-12:00 arasında yapılacaktır. Kayıtlar açıktır!',
    },
    category: 'Classes',
    priority: 'normal',
  },
  {
    title: {
      en: 'Ramadan Preparation Workshop',
      ar: 'ورشة عمل للاستعداد لرمضان',
      tr: 'Ramazan Hazırlık Atölyesi',
    },
    content: {
      en: 'Join us for a special workshop on preparing spiritually and practically for the blessed month of Ramadan. Topics include: setting goals, meal planning, and maximizing worship.',
      ar: 'انضموا إلينا في ورشة عمل خاصة للاستعداد روحيًا وعمليًا لشهر رمضان المبارك. تشمل الموضوعات: تحديد الأهداف، تخطيط الوجبات، وتعظيم العبادة.',
      tr: 'Mübarek Ramazan ayına ruhani ve pratik olarak hazırlanmak için özel atölyemize katılın. Konular: hedef belirleme, yemek planlaması ve ibadeti en üst düzeye çıkarma.',
    },
    category: 'Ramadan',
    priority: 'important',
  },
  {
    title: {
      en: 'Community Iftar Gathering',
      ar: 'تجمع إفطار المجتمع',
      tr: 'Topluluk İftar Buluşması',
    },
    content: {
      en: 'You are invited to our weekly community iftar every Friday during Ramadan. Break your fast with fellow community members. Donations welcome but not required.',
      ar: 'أنتم مدعوون إلى إفطار المجتمع الأسبوعي كل جمعة خلال رمضان. أفطروا مع أعضاء المجتمع. التبرعات مرحب بها ولكنها ليست إلزامية.',
      tr: 'Ramazan boyunca her Cuma topluluk iftarımıza davetlisiniz. Cemaat üyeleriyle birlikte orucunuzu açın. Bağışlar kabul edilir ancak zorunlu değildir.',
    },
    category: 'Ramadan',
    priority: 'normal',
  },
  {
    title: {
      en: 'Eid Prayer Announcement',
      ar: 'إعلان صلاة العيد',
      tr: 'Bayram Namazı Duyurusu',
    },
    content: {
      en: 'Eid prayer will be held at 8:00 AM at the main prayer hall. Please arrive early to secure parking. Overflow parking available at the adjacent lot. Eid Mubarak!',
      ar: 'ستقام صلاة العيد في الساعة 8:00 صباحًا في قاعة الصلاة الرئيسية. يرجى الحضور مبكرًا لتأمين مواقف السيارات. عيد مبارك!',
      tr: 'Bayram namazı sabah saat 8:00\'de ana namaz salonunda kılınacaktır. Lütfen park yeri bulmak için erken gelin. Bayramınız mübarek olsun!',
    },
    category: 'Eid',
    priority: 'urgent',
  },
  {
    title: {
      en: 'Building Fund Campaign Update',
      ar: 'تحديث حملة صندوق البناء',
      tr: 'Bina Fonu Kampanyası Güncellemesi',
    },
    content: {
      en: 'Alhamdulillah, we have raised 75% of our building fund goal! Thank you to all donors. Please continue to support this important project for our growing community.',
      ar: 'الحمد لله، جمعنا 75% من هدف صندوق البناء! شكرًا لجميع المتبرعين. يرجى الاستمرار في دعم هذا المشروع المهم لمجتمعنا المتنامي.',
      tr: 'Elhamdülillah, bina fonu hedefimizin %75\'ine ulaştık! Tüm bağışçılara teşekkür ederiz. Büyüyen topluluğumuz için bu önemli projeyi desteklemeye devam edin.',
    },
    category: 'Fundraising',
    priority: 'normal',
  },
  {
    title: {
      en: 'Youth Basketball Tournament',
      ar: 'بطولة كرة السلة للشباب',
      tr: 'Gençlik Basketbol Turnuvası',
    },
    content: {
      en: 'Calling all youth ages 13-18! Join our annual basketball tournament next Saturday at 2 PM. Teams of 5. Register at the front desk by Friday.',
      ar: 'نداء لجميع الشباب من سن 13-18! انضموا إلى بطولة كرة السلة السنوية السبت القادم الساعة 2 مساءً. فرق من 5 أشخاص. سجلوا في مكتب الاستقبال قبل يوم الجمعة.',
      tr: '13-18 yaş arası tüm gençlere sesleniyoruz! Gelecek Cumartesi saat 14:00\'te yıllık basketbol turnuvamıza katılın. 5 kişilik takımlar. Cuma gününe kadar kayıt olun.',
    },
    category: 'Youth',
    priority: 'normal',
  },
  {
    title: {
      en: 'Sisters Halaqa - New Time',
      ar: 'حلقة الأخوات - وقت جديد',
      tr: 'Hanımlar Halkası - Yeni Saat',
    },
    content: {
      en: 'The weekly sisters halaqa will now be held on Sundays at 11 AM instead of Saturdays. We will continue our study of Surah Al-Kahf. All sisters welcome!',
      ar: 'ستعقد حلقة الأخوات الأسبوعية الآن يوم الأحد في الساعة 11 صباحًا بدلاً من السبت. سنواصل دراستنا لسورة الكهف. جميع الأخوات مرحب بهن!',
      tr: 'Haftalık hanımlar halkası artık Cumartesi yerine Pazar günü saat 11:00\'de yapılacaktır. Kehf Suresi çalışmamıza devam edeceğiz. Tüm hanımlar davetlidir!',
    },
    category: 'Sisters',
    priority: 'normal',
  },
];

export class AnnouncementFactory extends BaseFactory<Announcement> {
  protected getTableName(): string {
    return 'announcements';
  }

  protected async getDefaults(): Promise<Partial<Announcement>> {
    const template = pickRandom(ANNOUNCEMENT_TEMPLATES);
    const status = pickWeighted({
      draft: 10,
      scheduled: 15,
      published: 60,
      archived: 15,
    }) as typeof STATUSES[number];

    const priority = pickWeighted({
      normal: 70,
      important: 25,
      urgent: 5,
    }) as typeof PRIORITIES[number];

    // Generate dates based on status
    const dates = this.generateDates(status);

    return {
      organization_id: '', // Must be set
      title: template.title,
      content: template.content,
      excerpt: this.generateExcerpt(template.content),
      priority,
      category: template.category,
      status,
      publish_at: dates.publishAt,
      expires_at: dates.expiresAt,
      target_audience: pickWeighted({
        all: 70,
        members: 25,
        specific_groups: 5,
      }) as typeof AUDIENCES[number],
      target_group_ids: [],
      is_pinned: priority === 'urgent' && Math.random() < 0.5,
      show_in_portal: true,
      show_in_admin: true,
      image_url: null,
      attachments: [],
      published_at: status === 'published' ? dates.publishAt : null,
    };
  }

  private generateDates(status: string): {
    publishAt: string | null;
    expiresAt: string | null;
  } {
    const now = new Date();

    if (status === 'draft') {
      return { publishAt: null, expiresAt: null };
    }

    if (status === 'scheduled') {
      const publishAt = addDays(now, Math.floor(Math.random() * 14) + 1);
      const expiresAt = addDays(publishAt, Math.floor(Math.random() * 30) + 7);
      return {
        publishAt: formatDbDateTime(publishAt),
        expiresAt: formatDbDateTime(expiresAt),
      };
    }

    if (status === 'published') {
      const publishAt = subMonths(now, Math.random() * 3);
      const expiresAt = Math.random() < 0.5
        ? formatDbDateTime(addDays(now, Math.floor(Math.random() * 30) + 7))
        : null;
      return {
        publishAt: formatDbDateTime(publishAt),
        expiresAt,
      };
    }

    // Archived
    const publishAt = subMonths(now, Math.floor(Math.random() * 6) + 3);
    return {
      publishAt: formatDbDateTime(publishAt),
      expiresAt: formatDbDateTime(subMonths(now, Math.random() * 2)),
    };
  }

  private generateExcerpt(content: { en: string; ar: string; tr: string }): { en: string; ar: string; tr: string } {
    const maxLength = 100;

    const truncate = (text: string) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    };

    return {
      en: truncate(content.en),
      ar: truncate(content.ar),
      tr: truncate(content.tr),
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withTitle(title: { en: string; ar?: string; tr?: string }): this {
    return this.with({
      title: {
        en: title.en,
        ar: title.ar || title.en,
        tr: title.tr || title.en,
      },
    });
  }

  withContent(content: { en: string; ar?: string; tr?: string }): this {
    const fullContent = {
      en: content.en,
      ar: content.ar || content.en,
      tr: content.tr || content.en,
    };
    return this.with({
      content: fullContent,
      excerpt: this.generateExcerpt(fullContent),
    });
  }

  asPublished(): this {
    const now = new Date();
    return this.with({
      status: 'published',
      publish_at: formatDbDateTime(subMonths(now, Math.random())),
      published_at: formatDbDateTime(subMonths(now, Math.random())),
    });
  }

  asDraft(): this {
    return this.with({
      status: 'draft',
      publish_at: null,
      published_at: null,
    });
  }

  asScheduled(): this {
    const futureDate = addDays(new Date(), Math.floor(Math.random() * 14) + 1);
    return this.with({
      status: 'scheduled',
      publish_at: formatDbDateTime(futureDate),
      published_at: null,
    });
  }

  asUrgent(): this {
    return this.with({
      priority: 'urgent',
      is_pinned: true,
    });
  }

  asImportant(): this {
    return this.with({ priority: 'important' });
  }

  withCategory(category: string): this {
    return this.with({ category });
  }

  asPinned(): this {
    return this.with({ is_pinned: true });
  }

  forMembers(): this {
    return this.with({ target_audience: 'members' });
  }

  forAll(): this {
    return this.with({ target_audience: 'all' });
  }
}
