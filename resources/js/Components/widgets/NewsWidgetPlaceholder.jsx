import { Newspaper, Clock } from "lucide-react";

const NewsWidgetPlaceholder = () => {
    return (
        <div className="card h-80">
            <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-adaptive-primary">
                        News
                    </h3>
                    <Clock className="h-4 w-4 text-adaptive-muted" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="mb-4">
                        <Newspaper className="h-12 w-12 text-adaptive-muted mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-adaptive-primary mb-2">
                            News Coming Soon
                        </h4>
                        <p className="text-sm text-adaptive-muted max-w-xs">
                            Stay tuned for the latest news and updates right
                            here on your dashboard.
                        </p>
                    </div>

                    <div className="text-xs text-adaptive-muted">
                        Feature in development
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsWidgetPlaceholder;
