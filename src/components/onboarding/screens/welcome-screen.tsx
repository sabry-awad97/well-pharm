import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Pill, ShieldCheck, BarChart4 } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const features = [
    {
      icon: <Pill className="h-4 w-4" />,
      text: 'Comprehensive inventory management',
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      text: 'Secure patient data handling',
    },
    {
      icon: <BarChart4 className="h-4 w-4" />,
      text: 'Advanced analytics and reporting',
    },
  ];

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md space-y-5">
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to <span className="text-primary">WellPharm</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Your complete pharmacy management solution
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="py-3">
          <div className="bg-muted relative mx-auto h-24 w-24 overflow-hidden rounded-full p-1">
            <img
              src="/logo.png"
              alt="WellPharm Logo"
              className="h-full w-full object-contain"
              onError={e => {
                e.currentTarget.src =
                  'https://via.placeholder.com/128?text=WellPharm';
              }}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <p className="text-sm">
            WellPharm is designed to streamline operations, enhance patient
            care, and ensure regulatory compliance.
          </p>

          <div className="bg-card/50 rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-medium">
              This setup wizard will guide you through:
            </h3>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-2 text-xs"
                  variants={itemVariants}
                  custom={index}
                >
                  <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full">
                    {feature.icon}
                  </div>
                  <span>{feature.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center pt-2"
        >
          <Button onClick={onNext} className="group gap-2">
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
