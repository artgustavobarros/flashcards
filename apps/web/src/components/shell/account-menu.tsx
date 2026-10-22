import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, SlidersHorizontal, User } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient, sessionQuery } from "~/lib/auth";

const WORDS = /\s+/;

// "Arthur Gustavo Costa" → "AC", "Dev" → "D".
function initials(name: string) {
  const words = name.trim().split(WORDS);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

interface AvatarUser {
  image?: string | null;
  name: string;
}

// The Google photo, or the initials while it loads or when there is none.
function UserAvatar({
  className,
  user,
}: {
  className?: string;
  user: AvatarUser | undefined;
}) {
  return (
    <Avatar className={className}>
      {user?.image ? (
        // Google photos can refuse requests that carry a Referer.
        <AvatarImage alt="" referrerPolicy="no-referrer" src={user.image} />
      ) : null}
      <AvatarFallback className="bg-accent font-heading font-semibold text-accent-foreground">
        {user ? initials(user.name) : <User className="size-[18px]" />}
      </AvatarFallback>
    </Avatar>
  );
}

export function AccountMenu() {
  const user = useQuery(sessionQuery).data?.user;
  const queryClient = useQueryClient();
  const router = useRouter();

  const signOut = useCallback(async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error("Não foi possível sair", {
        description: "Tente de novo em alguns instantes.",
      });
      return;
    }
    // Same rule as sign-in and a 401: nothing cached survives an account change.
    queryClient.clear();
    await router.navigate({ to: "/entrar" });
  }, [queryClient, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Conta" className="rounded-full">
        <UserAvatar className="size-10" user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {user ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-3 py-2">
              <UserAvatar className="size-10" user={user} />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium text-foreground text-sm">
                  {user.name}
                </p>
                <p className="truncate font-normal">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link to="/configuracoes">
            <SlidersHorizontal />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
