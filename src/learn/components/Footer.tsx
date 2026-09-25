import { FRAX_FORCE_DISCORD_URL } from '../../../shared/constants/socialLinks.ts';

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-bold text-foreground text-[18px]">MoneyOS</p>
          <p className="text-[11px] text-muted-foreground mt-[2px]">
            Built as a public good by Frax Force
          </p>
          <p className="text-[16px] text-muted-foreground mt-2">
            MoneyOS helps you understand better finance, step by step.
          </p>
        </div>

        <div>
          <p className="text-[16px] text-muted-foreground uppercase tracking-[0.1em] mb-3">
            Follow
          </p>
          <div className="space-y-1.5">
            <a
              href="https://x.com/FraxForce?s=20"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[16px] text-muted-foreground hover:text-foreground transition-colors"
            >
              @FraxForce
            </a>
          </div>
        </div>

        <div>
          <p className="text-[16px] text-muted-foreground uppercase tracking-[0.1em] mb-3">
            Community
          </p>
          <a
            href={FRAX_FORCE_DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[16px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
