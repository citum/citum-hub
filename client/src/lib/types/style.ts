export interface Style {
	id: string;
	title: string;
	filename: string;
	description?: string;
	fields?: string[];
	is_public: boolean;
	updated_at: string;
	user_id: string;
}
