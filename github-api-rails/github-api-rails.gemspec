$: << "lib"
require "github-api/version"

Gem::Specification.new do |s|
	s.name = "github-api-rails"
	s.version = GithubAPI::VERSION::IS
	s.summary = "Javascript bindings for the Github API"
	s.description = <<-EOF
Javascript bindings for the Github API
	EOF

	s.author = "fitzgen"
	s.email = "xx@gmail.com"
	s.homepage = "http://github.com/fitzgen/github-api"
	s.rubyforge_project = "xx"

	s.files = `git ls-files`.split("\n")
end
