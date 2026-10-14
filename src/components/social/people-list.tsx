import Link from "next/link";
import { Avatar } from "@/components/avatar";

export type Person = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export function PeopleList({ people, empty }: { people: Person[]; empty: string }) {
  if (!people.length) {
    return <p className="py-16 text-center text-zinc-500">{empty}</p>;
  }

  return (
    <ul className="flex flex-col">
      {people.map((person) => {
        const nickname = person.username ? `@${person.username}` : person.full_name || "이름 없음";
        const href = person.username ? `/@${person.username}` : undefined;
        const row = (
          <>
            <Avatar src={person.avatar_url} name={nickname} size={44} />
            <span className="truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
              {nickname}
            </span>
          </>
        );

        return (
          <li key={person.id} className="border-b border-black/5 last:border-b-0 dark:border-white/10">
            {href ? (
              <Link href={href} className="flex items-center gap-3 py-3 hover:opacity-80">
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-3">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
