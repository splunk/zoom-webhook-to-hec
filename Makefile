SHELL:=/bin/bash

.PHONY: clean
clean:
	rm -rf node_modules
	rm -f function.zip

.PHONY: deps
deps:
	. ${HOME}/.nvm/nvm.sh && nvm use 18
	npm install --registry=https://registry.npmjs.org

.PHONY: package
package: clean deps
	zip -r function.zip index.js node_modules LICENSE.md README.md
