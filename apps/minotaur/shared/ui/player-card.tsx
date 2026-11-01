import { Link } from "../components/config/link/link";
import { createLink } from "../components/config/link/link.model";
import { Avatar } from "./avatar";
import { Typography } from "./typography";

type PlayerCardProps = {
  nickname: string,
  avatar: string
}

export const PlayerCard = ({ nickname, avatar }: PlayerCardProps) => {
  const link = createLink("player", nickname);

  return (
    <div className="flex flex-col items-center min-w-0 w-full justify-center gap-2 bg-neutral-900 rounded-xl p-2">
      <Link href={link}>
        <Avatar nickname={nickname} url={avatar} className="size-16" />
      </Link>
      <Link href={link} className="flex flex-col w-full min-w-0 overflow-hidden">
        <Typography className="block font-semibold text-nowrap text-center truncate">
          {nickname}
        </Typography>
      </Link>
    </div>
  )
}
