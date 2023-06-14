const fastify = require('fastify')
const sharp = require('sharp')
const axios = require('axios')

const app = fastify()

// Enable gzip compression
app.register(require('@fastify/compress'))

// Response caching configuration
const cache = new Map()

// Rate limiting configuration (change values as needed)
const RATE_LIMIT_MAX_REQUESTS = 100
const RATE_LIMIT_TIME_WINDOW = 60 * 1000 // 1 minute

// Rate limiting plugin
app.register(require('@fastify/rate-limit'), {
	max: RATE_LIMIT_MAX_REQUESTS,
	timeWindow: RATE_LIMIT_TIME_WINDOW,
})

app.get('/', {
	config: {
		cache: {
			expiresIn: 60 * 60 * 24, // 24 hours
		},
	},
	async handler(request, reply) {
		const {url, width} = request.query

		if (!url || !width) {
			return reply.code(400).send({status: 'failed', message: 'Missing URL and width query.'})
		}

		const parsedWidth = parseInt(width)

		if (parsedWidth > 2000) {
			return reply.code(400).send({status: 'failed', message: 'Width over 2000 is not allowed'})
		}

		if (isNaN(parsedWidth)) {
			return reply
				.code(400)
				.send({status: 'failed', message: 'Invalid width value. Must be a number.'})
		}

		const cacheKey = `${url}-${parsedWidth}`
		const cachedImage = cache.get(cacheKey)

		if (cachedImage) {
			return reply.type('image/jpeg').send(cachedImage)
		}

		try {
			const response = await axios.get(url, {responseType: 'arraybuffer'})
			const resizedImage = await sharp(response.data).resize({width: parsedWidth}).toBuffer()

			// Cache the resized image
			cache.set(cacheKey, resizedImage)

			reply.type('image/jpeg').send(resizedImage)
		} catch (error) {
			console.error(error)
			reply.code(500).send('Internal server error')
		}
	},
})

app.setErrorHandler(function (error, request, reply) {
	console.error(error)
	reply.code(500).send('Internal server error')
})

app.listen(1311, (err) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	console.log('Server started on port 1311')
})
