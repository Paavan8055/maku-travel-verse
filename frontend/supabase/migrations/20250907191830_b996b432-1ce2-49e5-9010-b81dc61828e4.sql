-- Create GPT Bot Integration Registry
CREATE TABLE public.gpt_bot_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_name TEXT NOT NULL,
  bot_type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  chat_gpt_url TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  integration_status TEXT NOT NULL DEFAULT 'inactive' CHECK (integration_status IN ('active', 'inactive', 'pending', 'error')),
  usage_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_system_bot BOOLEAN NOT NULL DEFAULT false
);

-- Create GPT Bot Usage Logs
CREATE TABLE public.gpt_bot_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.gpt_bot_registry(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  request_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_data JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GPT Bot Workflows
CREATE TABLE public.gpt_bot_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  description TEXT,
  bot_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gpt_bot_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpt_bot_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpt_bot_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all GPT bots" ON public.gpt_bot_registry
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active GPT bots" ON public.gpt_bot_registry
  FOR SELECT USING (auth.uid() IS NOT NULL AND integration_status = 'active');

CREATE POLICY "Admins can view all GPT bot logs" ON public.gpt_bot_usage_logs
  FOR SELECT USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can view their own GPT bot logs" ON public.gpt_bot_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON public.gpt_bot_usage_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all workflows" ON public.gpt_bot_workflows
  FOR ALL USING (is_secure_admin(auth.uid()));

CREATE POLICY "Users can manage their own workflows" ON public.gpt_bot_workflows
  FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Create triggers for updated_at
CREATE TRIGGER update_gpt_bot_registry_updated_at
  BEFORE UPDATE ON public.gpt_bot_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gpt_bot_workflows_updated_at
  BEFORE UPDATE ON public.gpt_bot_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 70 GPT bots from the spreadsheet
INSERT INTO public.gpt_bot_registry (bot_name, bot_type, category, description, chat_gpt_url, capabilities, is_system_bot) VALUES
('Ava', 'Growth GPT', 'Social Media', 'Social media growth expert offering strategies to gain followers.', 'https://chatgpt.com/g/g-67a21a9fbdec819181a09a21c47eab1c-ava-growth-gpt', '["social_media_growth", "follower_strategies", "engagement_tactics"]'::jsonb, true),
('Stella', 'Social media manager GPT', 'Social Media', 'Assists social media managers with content creation and engagement strategies.', 'https://chatgpt.com/g/g-67a21bb6482c81919bdebe7ca5530c55-stella-social-media-manager-gpt', '["content_creation", "engagement_strategies", "social_media_management"]'::jsonb, true),
('Leo', 'Viral Scripts GPT', 'Social Media', 'Generates viral YouTube video scripts with SEO and engagement strategies.', 'https://chatgpt.com/g/g-67a21c93a3988191938e7159e22e271d-leo-viral-scripts-gpt', '["script_writing", "youtube_optimization", "viral_content", "seo"]'::jsonb, true),
('Cara', 'Content Repurposing Bot', 'Social Media', 'Adapts content for various social media platforms.', 'https://chatgpt.com/g/g-67a21d30e91c81918fd5774d1d5ce6d2-cara-content-repurposing-bot', '["content_adaptation", "multi_platform", "repurposing"]'::jsonb, true),
('Febo', 'Facebook Engagement Bot', 'Social Media', 'Crafts engaging, shareable Facebook content.', 'https://chatgpt.com/g/g-67a39ba98c248191b79595583abd0718-febo-engagement-bot', '["facebook_content", "engagement", "shareability"]'::jsonb, true),
('Instar', 'Instagram Growth Bot', 'Social Media', 'Offers tips on content, trends, and audience growth for Instagram.', 'https://chatgpt.com/g/g-67a21e61d39481918a0b4380dd5d493d-instar-growth-bot', '["instagram_growth", "content_trends", "audience_building"]'::jsonb, true),
('Linx', 'LinkedIn Growth Bot', 'Social Media', 'Offers expert guidance in enhancing business profiles and strategies on LinkedIn.', 'https://chatgpt.com/g/g-67a21f2aeb488191838a35339ada1a82-linx-growth-bot', '["linkedin_optimization", "business_profiles", "professional_networking"]'::jsonb, true),
('Sandra', 'Social Media Strategy Bot', 'Social Media', 'Offers practical advice for effective social media strategies.', 'https://chatgpt.com/g/g-67a21fd71a308191bf42bd509c4d20a0-sandra-social-media-strategy-bot', '["strategy_planning", "social_media_consulting", "campaign_optimization"]'::jsonb, true),
('Xavier', 'X/Twitter Growth Bot', 'Social Media', 'Crafts engaging X/Twitter content with emojis and hashtags.', 'https://chatgpt.com/g/g-67a224ec60d88191b65283816a538486-xavier-growth-bot', '["twitter_content", "hashtag_optimization", "engagement"]'::jsonb, true),
('Viddi', 'Viral Video Creation Bot', 'Social Media', 'Brainstorms viral YouTube Shorts ideas.', 'https://chatgpt.com/g/g-67a22576610c819191ae29b68f8c9934-viddi-viral-video-creation-bot', '["video_concepts", "youtube_shorts", "viral_content"]'::jsonb, true),
('Vex', 'Viral Hooks Creator Bot', 'Social Media', 'Creates captivating viral hooks, offering a conversational tone.', 'https://chatgpt.com/g/g-67a225f90ebc8191893f9eb7a91942cb-vex-viral-hooks-creator-bot', '["hook_creation", "viral_content", "engagement_hooks"]'::jsonb, true),
('Finn', 'Podcast GPT', 'Content Creation', 'Creates engaging podcast scripts, outlines, and interview questions.', 'https://chatgpt.com/g/g-67a2267819a88191b41f4978702789f1-finn-podcast-gpt', '["podcast_scripts", "interview_questions", "content_planning"]'::jsonb, true),
('Ivy', 'Newsletter GPT', 'Content Creation', 'Creates engaging newsletter content tailored to the user''s audience.', 'https://chatgpt.com/g/g-67a22739b7a08191ba6ed469da04a21b-ivy-newsletter-gpt', '["newsletter_content", "audience_targeting", "email_marketing"]'::jsonb, true),
('Max', 'Content Planner GPT', 'Content Creation', 'Helps plan and optimize content strategy with topic ideas and content calendar.', 'https://chatgpt.com/g/g-67a227ab61e08191aecd023435ad4e67-max-content-planner-gpt', '["content_strategy", "content_calendar", "topic_research"]'::jsonb, true),
('Cora', 'Email Subject Line GPT', 'Content Creation', 'Generates effective email subject lines for marketing.', 'https://chatgpt.com/g/g-67a22835c09c819188107a57778fe8cb-cora-email-subject-line-gpt', '["email_subjects", "marketing_copy", "open_rate_optimization"]'::jsonb, true),
('Orion', 'Presentation Maker GPT', 'Content Creation', 'Assists in creating visually appealing and effective presentations.', 'https://chatgpt.com/g/g-67a228b1cec48191b41b6d627b2afcb7-orion-presentation-maker-gpt', '["presentation_design", "visual_content", "business_presentations"]'::jsonb, true),
('Sage', 'Summariser GPT', 'Content Creation', 'Provides concise and accurate summaries of lengthy texts.', 'https://chatgpt.com/g/g-67a229c0b6508191b1297234a0190564-sage-summariser-gpt', '["text_summarization", "content_analysis", "information_extraction"]'::jsonb, true),
('Dina', 'Digital Content Creation Bot', 'Content Creation', 'Offers expertise in digital marketing content creation.', 'https://chatgpt.com/g/g-67a22a500f5c81918e2fe568199de70a-dina-digital-content-creation-bot', '["digital_content", "marketing_materials", "creative_writing"]'::jsonb, true),
('Titan', 'Business Offer GPT', 'Business', 'Helps businesses create compelling, tailored offers for their products or services.', 'https://chatgpt.com/g/g-67a22b0f40e48191b8785e49e3ce0d61-titan-business-offer-gpt', '["offer_creation", "value_propositions", "sales_optimization"]'::jsonb, true),
('Aurora', 'Sales negotiation coach GPT', 'Business', 'Provides strategies and tips for sales negotiations.', 'https://chatgpt.com/g/g-67a22ba84f90819185ed94d81e50ef12-aurora-sales-negotiation-coach-gpt', '["negotiation_strategies", "sales_coaching", "deal_closing"]'::jsonb, true),
('Linda', 'Sales template GPT', 'Business', 'Generates customizable sales templates for various needs.', 'https://chatgpt.com/g/g-67a22c03687481919ba010c181862c18-linda-sales-template-gpt', '["sales_templates", "proposal_generation", "sales_automation"]'::jsonb, true),
('Echo', 'Pitch Perfect GPT', 'Business', 'Guides users in crafting concise and compelling pitches.', 'https://chatgpt.com/g/g-67a22c896208819188d819d3630d17f0-echo-pitch-perfect-gpt', '["pitch_creation", "presentation_skills", "persuasive_communication"]'::jsonb, true),
('Cassie', 'Client Onboarding Bot', 'Business', 'Provides a professional B2B agency client onboarding guide.', 'https://chatgpt.com/g/g-67a22cdf08a48191b8eee865a5ecc88b-cassie-client-onboarding-bot', '["client_onboarding", "process_automation", "customer_success"]'::jsonb, true),
('Oliver', 'Pricing strategy expert GPT', 'Business', 'Offers competitive and profitable pricing strategies for businesses.', 'https://chatgpt.com/g/g-67a22d4e085c8191ae756460ba2e6302-oliver-pricing-strategy-expert-gpt', '["pricing_strategies", "competitive_analysis", "profit_optimization"]'::jsonb, true),
('Ember', 'Branding Expert GPT', 'Business', 'Expert branding advice for building and maintaining a strong brand identity.', 'https://chatgpt.com/g/g-67a22da6728881919f7955bebd74144b-ember-branding-expert-gpt', '["brand_strategy", "brand_identity", "brand_positioning"]'::jsonb, true),
('Ruby', 'Email List Growth GPT', 'Business', 'Assists users in growing their email lists with personalized tips and strategies.', 'https://chatgpt.com/g/g-67a37366d81c8191baa6fe5f39ec07d4-ruby-email-list-growth-gpt', '["email_marketing", "list_building", "lead_generation"]'::jsonb, true),
('Blaze', 'Sales Funnel Bot', 'Business', 'Optimizes and automates the sales process for better conversion rates.', 'https://chatgpt.com/g/g-67a24cf199308191876b2dcf0ed25ff3-blaze-sales-funnel-bot', '["sales_funnels", "conversion_optimization", "automation"]'::jsonb, true),
('Axel', 'Customer relationship management GPT', 'Business', 'Assists in managing and improving customer relationships.', 'https://chatgpt.com/g/g-67a24d5c80f881918547f2c90f8f7667-axel-customer-relationship-management-gpt', '["crm_management", "customer_retention", "relationship_building"]'::jsonb, true),
('Oscar', 'Task Prioritiser GPT', 'Productivity & Management', 'Helps users prioritize tasks effectively.', 'https://chatgpt.com/g/g-67a24dc100a88191935f29971ad08811-oscar-task-prioritiser-gpt', '["task_management", "priority_setting", "productivity"]'::jsonb, true),
('Nico', 'Productivity Enhancer GPT', 'Productivity & Management', 'Boosts workplace productivity with tips, tools, and personalized advice.', 'https://chatgpt.com/g/g-67a24e185c3881919d5d16e46e834fa4-nico-productivity-enhancer-gpt', '["productivity_optimization", "workflow_improvement", "efficiency"]'::jsonb, true),
('Sadie', 'Remote Work Bot', 'Productivity & Management', 'Provides tools and support for productive remote work', 'https://chatgpt.com/g/g-67a24e89bdb88191a553234bc344071c-sadie-remote-work-bot', '["remote_work", "team_collaboration", "virtual_productivity"]'::jsonb, true),
('Phoebe', 'Logo generator GPT', 'Creative Tools', 'Assists users in designing logos for businesses, projects, or personal brands.', 'https://chatgpt.com/g/g-67a24ef29e348191a29ff35386879225-phoebe-logo-generator-gpt', '["logo_design", "brand_visuals", "creative_design"]'::jsonb, true),
('Theo', 'Landing page writer GPT', 'Creative Tools', 'Creates compelling landing page content for various industries.', 'https://chatgpt.com/g/g-67a24f8455fc81919142351f8e2dad73-theo-landing-page-writer-gpt', '["landing_pages", "conversion_copy", "web_content"]'::jsonb, true),
('Aria', 'Create Course GPT', 'Creative Tools', 'Assists in creating educational courses and lesson plans.', 'https://chatgpt.com/g/g-67a250b6468881918c38c189b06753b3-aria-create-course-gpt', '["course_creation", "educational_content", "curriculum_design"]'::jsonb, true),
('Aiden', 'Personal Mentor GPT', 'Personal Development', 'Helps users find their own answers and advice, guiding them to discover personalized and meaningful solutions', 'https://chatgpt.com/g/g-67a2511ece648191ae72c285e318adb1-aiden-personal-mentor-gpt', '["personal_coaching", "self_development", "guidance"]'::jsonb, true),
('Elara', 'Time management GPT', 'Personal Development', 'Offers personalized strategies and tools for effective time management.', 'https://chatgpt.com/g/g-67a251a5e954819194d1383739eee1d8-elara-time-management-gpt', '["time_management", "productivity", "scheduling"]'::jsonb, true),
('Jasper', 'Honest Feedback GPT', 'Personal Development', 'Provides constructive and honest feedback with empathy and actionable suggestions.', 'https://chatgpt.com/g/g-67a251fe9d2081919213003b74c47548-jasper-honest-feedback-gpt', '["feedback_delivery", "performance_improvement", "constructive_criticism"]'::jsonb, true),
('Ethan', 'Problems & Solutions GPT', 'Strategy & Analysis', 'Helps users identify problems and suggest solutions in various domains.', 'https://chatgpt.com/g/g-67a2526eccc48191a5ce9f5c46c2686b-ethan-problems-solutions-gpt', '["problem_solving", "solution_design", "strategic_thinking"]'::jsonb, true),
('Sharon', 'Target Audience Analyzer', 'Strategy & Analysis', 'Analyzes target audiences for businesses and brands', 'https://chatgpt.com/g/g-67a253089ba08191831fdaaed68b0f89-sharon-target-audience-analyzer', '["audience_analysis", "market_research", "customer_insights"]'::jsonb, true),
('Iris', 'Innovation Coach GPT', 'Strategy & Analysis', 'Encourages creativity and innovation within teams.', 'https://chatgpt.com/g/g-67a33b42e8c081918bfd9fdc4f50d7c7-iris-innovation-coach-gpt', '["innovation_management", "creative_thinking", "team_development"]'::jsonb, true),
('Remy', 'Risk Management GPT', 'Strategy & Analysis', 'Helps businesses manage risks with strategies and planning.', 'https://chatgpt.com/g/g-67a33bb43ef0819193c5e7d9517649cd-remy-risk-management-gpt', '["risk_assessment", "strategic_planning", "business_continuity"]'::jsonb, true),
('Zenith', 'Pricing Strategy Bot', 'Strategy & Analysis', 'Provides pricing strategies based on market analysis.', 'https://chatgpt.com/g/g-67a33c0777488191b380e3ae1d7cb73f-zenith-pricing-strategy-bot', '["pricing_analysis", "market_positioning", "competitive_pricing"]'::jsonb, true),
('Blake', 'E-commerce Optimization Bot', 'E-commerce', 'Optimizes online stores with insights and strategies.', 'https://chatgpt.com/g/g-67a33c59b74c819183ed3b31121b3e25-blake-e-commerce-optimization-bot', '["ecommerce_optimization", "conversion_rate", "online_retail"]'::jsonb, true),
('Lyra', 'Customer Segmentation Bot', 'E-commerce', 'Analyzes customer data to create detailed segments for targeted marketing.', 'https://chatgpt.com/g/g-67a33ca88e9081918072f7a0d2f41c3d-lyra-customer-segmentation-bot', '["customer_segmentation", "data_analysis", "targeted_marketing"]'::jsonb, true),
('Nora', 'Invoice Management Bot', 'Finance & Operations', 'Automates invoice creation and management for businesses.', 'https://chatgpt.com/g/g-67a33d00f6a481918a0fbb7dd5410af2-nora-invoice-bot', '["invoice_automation", "financial_management", "accounting"]'::jsonb, true),
('Vinnie', 'Virtual Assistant Bot', 'Assistants', 'Provides expert guidance for virtual assistant success.', 'https://chatgpt.com/g/g-67a33d57ad4c81919cb9e9bc2697c7ea-vinnie-virtual-assistant-bot', '["virtual_assistance", "administrative_support", "task_automation"]'::jsonb, true),
('Bobby', 'Business Assistant Bot', 'Assistants', 'Offers business advice, strategies and growth tactics.', 'https://chatgpt.com/g/g-67a33dab6a8881918fd5b9c85b334bdf-bobby-business-assistant-bot', '["business_consulting", "strategic_advice", "growth_strategies"]'::jsonb, true),
('Ceevee', 'CV Enhancement Bot', 'Jobseekers', 'Provides guidance for crafting standout CVs.', 'https://chatgpt.com/g/g-67a33f07038c819188d87cae3bdda686-ceevee-cv-enhancement-bot', '["resume_writing", "career_development", "job_applications"]'::jsonb, true),
('Emmi', 'Excel Mentor Bot', 'Jobseekers', 'Offers a comprehensive excel guide for all skill levels.', 'https://chatgpt.com/g/g-67a33f598f208191ab708829c09a27cc-emmi-excel-mentor-bot', '["excel_training", "data_analysis", "spreadsheet_automation"]'::jsonb, true),
('Inti', 'Interview Process Bot', 'Jobseekers', 'Provides expert coaching for mock interviews and feedback.', 'https://chatgpt.com/g/g-67a33faa157c81919c95b08e834626d0-inti-interview-process-bot', '["interview_coaching", "career_preparation", "professional_development"]'::jsonb, true),
('Cindy', 'Customer Service Bot', 'Customer Support', 'Offers friendly coaching and practical tips for better customer service.', 'https://chatgpt.com/g/g-67a33ff0ddec81918828d9ce300921fc-cindy-customer-service-bot', '["customer_service", "support_training", "communication_skills"]'::jsonb, true),
('Victor', 'Virtual Support Bot', 'Customer Support', 'Guides users in effectively addressing client product queries.', 'https://chatgpt.com/g/g-67a34050f0a08191855952604cb742f7-victor-virtual-support-bot', '["technical_support", "customer_queries", "problem_resolution"]'::jsonb, true),
('Adam', 'Ad Optimisation Bot', 'Marketing', 'Enhances ad copy for clarity and impact.', 'https://chatgpt.com/g/g-67a340a48708819195c65801c91f18e1-adam-ad-optimisation-bot', '["ad_optimization", "copy_enhancement", "marketing_campaigns"]'::jsonb, true),
('Barbara', 'Blog Writing Bot', 'Marketing', 'Offers expertise in writing engaging, SEO-friendly blog content.', 'https://chatgpt.com/g/g-67a340f0b95c819192c2311117191d6d-barbara-blog-writing-bot', '["blog_writing", "seo_content", "content_marketing"]'::jsonb, true),
('Celia', 'Cold Email Bot', 'Marketing', 'Provides expertise in crafting effective cold emails.', 'https://chatgpt.com/g/g-67a34148dee08191a2a4dfd3de54916e-celia-cold-email-bot', '["cold_outreach", "email_campaigns", "lead_generation"]'::jsonb, true),
('Cody', 'Copywriting Bot', 'Marketing', 'Enhances and refines copy, providing expert guidance.', 'https://chatgpt.com/g/g-67a341a6cd9081919c6fb8e0632dbe37-cody-copywriting-bot', '["copywriting", "content_optimization", "persuasive_writing"]'::jsonb, true),
('Juno', 'Email Marketing GPT', 'Marketing', 'Assists with creating engaging email marketing content.', 'https://chatgpt.com/g/g-67a342c90c0081919105a2085840c3f7-juno-email-marketing-gpt', '["email_marketing", "campaign_creation", "audience_engagement"]'::jsonb, true),
('Dimarko', 'Digital Marketing Bot', 'Marketing', 'Guides agencies in implementing customized strategies for digital success.', 'https://chatgpt.com/g/g-67a3433589988191ae7d23de32398a72-dimarko-digital-marketing-bot', '["digital_strategy", "marketing_automation", "campaign_management"]'::jsonb, true),
('Dipedi', 'Digital Product Development Bot', 'Marketing', 'Guides you through product development, providing expert advice and industry insights.', 'https://chatgpt.com/g/g-67a343959ea881918e87b4e63bca3584-dipedi-digital-product-development-bot', '["product_development", "market_analysis", "innovation_strategy"]'::jsonb, true),
('Mape', 'Marketing Persona Bot', 'Marketing', 'Provides expertise in detailed marketing persona development.', 'https://chatgpt.com/g/g-67a343dfc94481918124245f8f163ffd-mape-marketing-persona-bot', '["persona_development", "customer_profiling", "target_marketing"]'::jsonb, true),
('Sebo', 'SEO Optimisation Bot', 'Marketing', 'Boosts your website''s performance by quickly finding the best keywords.', 'https://chatgpt.com/g/g-67a34445142081919a707de2e2cb249f-sebo-seo-optimisation-bot', '["seo_optimization", "keyword_research", "search_engine_ranking"]'::jsonb, true),
('Sophie', 'Strategic Market Bot', 'Marketing', 'Offers comprehensive competitor analysis and actionable insights.', 'https://chatgpt.com/g/g-67a36ef9e9e48191acf1b970a4ffc8b0-sophie-strategic-market-bot', '["competitive_analysis", "market_intelligence", "strategic_insights"]'::jsonb, true),
('Lila', 'Affiliate Marketing Bot', 'Marketing', 'Helps manage and optimize affiliate marketing programs.', 'https://chatgpt.com/g/g-67a36f43198c819183da7399c777fbc8-lila-affiliate-marketing-bot', '["affiliate_management", "partnership_marketing", "revenue_optimization"]'::jsonb, true),
('Cena', 'Client Avatar Simulation Bot', 'Sales and Communication', 'Simulates a client avatar in sales conversations.', 'https://chatgpt.com/g/g-67a36fbdd6b0819183069b7974fd60b5-cena-client-avatar-simulation-bot-for-sales', '["client_simulation", "sales_training", "conversation_practice"]'::jsonb, true),
('Sienna', 'Strategic Sales Advisor Bot', 'Sales and Communication', 'Assists in crafting effective digital sales strategies with actionable advice.', 'https://chatgpt.com/g/g-67a37012020481919c6dbf2ccc5d10ec-sienna-strategic-sales-advisor-bot', '["sales_strategy", "digital_sales", "strategic_planning"]'::jsonb, true),
('Milo', 'Book writing GPT', 'Writing', 'Helps with book writing: plots, characters, themes, dialogue.', 'https://chatgpt.com/g/g-67a3706c8df48191b1d3a5a198cb85bd-milo-book-writing-gpt', '["book_writing", "creative_writing", "story_development"]'::jsonb, true),
('Zoe', 'Character creator GPT', 'Writing', 'Creates unique characters for stories, games, and creative projects', 'https://chatgpt.com/g/g-67a370db7828819198e32ed4be235ce7-zoe-character-creator-gpt', '["character_development", "creative_writing", "storytelling"]'::jsonb, true),
('Phoenix', 'Rewrite GPT', 'Writing', 'Paraphrases texts for clarity and originality, tailored to various purposes.', 'https://chatgpt.com/g/g-67a371439bc48191a7ee098907834031-phoenix-rewrite-gpt', '["text_rewriting", "content_enhancement", "plagiarism_prevention"]'::jsonb, true),
('Grant', 'Grammar Bot', 'Writing', 'Offers friendly grammar-focused English tutoring.', 'https://chatgpt.com/g/g-67a3718e952081918d7d718a2aae6477-grant-grammar-bot', '["grammar_checking", "writing_improvement", "language_tutoring"]'::jsonb, true),
('Sally', 'Sales Story Creation Bot', 'Writing', 'Provides creative assistance for crafting engaging short stories.', 'https://chatgpt.com/g/g-67a371ccafd881919a29ee4f0405dc30-sally-sales-story-creation-bot', '["storytelling", "sales_narratives", "creative_writing"]'::jsonb, true);