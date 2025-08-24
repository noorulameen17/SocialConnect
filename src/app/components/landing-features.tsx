import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Globe, Heart, MessageCircle, Shield, Users, Zap } from "lucide-react"

const features = [
	{
		icon: Users,
		title: "Connect Instantly",
		description: "Find and connect with friends, family, and like-minded people from around the world.",
	},
	{
		icon: MessageCircle,
		title: "Real-time Messaging",
		description: "Chat with friends through instant messaging, voice calls, and video conversations.",
	},
	{
		icon: Heart,
		title: "Share Moments",
		description: "Post photos, videos, and thoughts to share your life's special moments with your network.",
	},
	{
		icon: Shield,
		title: "Privacy First",
		description: "Your data is protected with end-to-end encryption and granular privacy controls.",
	},
	{
		icon: Zap,
		title: "Lightning Fast",
		description: "Experience blazing-fast performance with our optimized platform and global CDN.",
	},
	{
		icon: Globe,
		title: "Global Communities",
		description: "Discover and join communities based on your interests, hobbies, and passions.",
	},
]

export function LandingFeatures() {
	return (
		<section id="features" className="py-20 sm:py-32">
			<div className="mx-auto w-full max-w-7xl px-4 md:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Everything you need to stay connected
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						Powerful features designed to bring people together and create meaningful connections.
					</p>
				</div>

				<div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
									<feature.icon className="h-6 w-6 text-primary" />
								</div>
								<CardTitle className="font-heading text-xl text-card-foreground">
									{feature.title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-muted-foreground">
									{feature.description}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	)
}
