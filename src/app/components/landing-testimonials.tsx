import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Card, CardContent } from "@/app/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
	{
		name: "Sarah Johnson",
		role: "Content Creator",
		avatar: "",
		content:
			"SocialConnect has completely transformed how I engage with my audience. The interface is intuitive and the features are exactly what I needed.",
		rating: 5,
	},
	{
		name: "Michael Chen",
		role: "Small Business Owner",
		avatar: "",
		content:
			"The community features helped me connect with other entrepreneurs. I've built valuable relationships that have grown my business.",
		rating: 5,
	},
	{
		name: "Emily Rodriguez",
		role: "Student",
		avatar: "",
		content:
			"I love how easy it is to stay connected with friends and discover new communities. The privacy controls give me peace of mind.",
		rating: 5,
	},
]

export function LandingTestimonials() {
	return (
		<section id="testimonials" className="bg-muted/30 py-20 sm:py-32">
			<div className="mx-auto w-full max-w-7xl px-4 md:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Loved by thousands of users
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						See what our community has to say about their SocialConnect
						experience.
					</p>
				</div>

				<div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{testimonials.map((testimonial, index) => (
						<Card
							key={index}
							className="bg-background border-border"
						>
							<CardContent className="p-6">
								<div className="flex items-center space-x-1 mb-4">
									{[...Array(testimonial.rating)].map((_, i) => (
										<Star
											key={i}
											className="h-4 w-4 fill-accent text-accent"
										/>
									))}
								</div>
								<p className="text-foreground mb-6">
									"{testimonial.content}"
								</p>
								<div className="flex items-center space-x-3">
									<Avatar>
										<AvatarImage
											src={
												testimonial.avatar ||
												""
											}
											alt={testimonial.name}
										/>
										<AvatarFallback>
											{testimonial.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-semibold text-foreground">
											{testimonial.name}
										</p>
										<p className="text-sm text-muted-foreground">
											{testimonial.role}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	)
}
