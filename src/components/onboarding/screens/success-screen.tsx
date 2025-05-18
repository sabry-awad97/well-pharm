import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface SuccessScreenProps {
  onFinish: () => void;
}

export function SuccessScreen({ onFinish }: SuccessScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
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

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.2,
      },
    },
  };

  const features = [
    {
      icon: <Rocket className="h-4 w-4" />,
      title: 'Get Started',
      text: 'Manage inventory and process prescriptions',
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      title: 'Stay Compliant',
      text: 'Track patient records securely',
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: 'Grow Your Team',
      text: 'Configure additional users and permissions',
    },
  ];

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md space-y-4 text-center">
        <motion.div className="flex justify-center" variants={iconVariants}>
          <div className="relative">
            <div className="bg-primary/20 absolute -inset-3 rounded-full blur-md"></div>
            <div className="bg-primary/10 text-primary relative flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold tracking-tight">Setup Complete!</h2>
          <p className="text-muted-foreground text-sm">
            Your WellPharm pharmacy management system has been successfully
            configured.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-card/50 hover:bg-card rounded-lg border p-2 shadow-sm transition-colors"
                variants={itemVariants}
                custom={index}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="bg-primary/10 text-primary mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full">
                  {feature.icon}
                </div>
                <h3 className="mb-0.5 text-xs font-medium">{feature.title}</h3>
                <p className="text-muted-foreground text-xs">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-2">
          <Button onClick={onFinish} size="sm" className="group gap-1">
            Start Using WellPharm
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
