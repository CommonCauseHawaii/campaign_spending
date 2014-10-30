# This monkey patch triggers a Mac OS X Notification Center notification using
# the terminal-notifier gem.
#
# If you start jekyll without bundle, first install the necessary gems:
#
# gem install terminal-notifier
# gem install terminal-notifier-guard
#
# If you start jekyll with bundle exec, ensure the above two gems are in
# your Gemfile:
#
# gem 'terminal-notifier'
# gem 'terminal-notifier-guard' 
 
module Jekyll
  class Site
    alias old_write write
    def write
      old_write
      if `uname`.strip == "Darwin"
        `terminal-notifier -title "#{config['title'] ? config['title'] : 'Jekyll Site'}" -message "Jekyll generate complete."`
      end
    end
  end
end
