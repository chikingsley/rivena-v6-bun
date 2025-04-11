# This file was auto-generated by Fern from our API Definition.

import typing
from ...core.client_wrapper import SyncClientWrapper
from ...core.request_options import RequestOptions
from ..types.return_voice import ReturnVoice
from ...core.pydantic_utilities import parse_obj_as
from ..errors.unprocessable_entity_error import UnprocessableEntityError
from ..types.http_validation_error import HttpValidationError
from json.decoder import JSONDecodeError
from ...core.api_error import ApiError
from ...core.client_wrapper import AsyncClientWrapper

# this is used as the default value for optional parameters
OMIT = typing.cast(typing.Any, ...)


class VoicesClient:
    def __init__(self, *, client_wrapper: SyncClientWrapper):
        self._client_wrapper = client_wrapper

    def create(
        self,
        *,
        generation_id: str,
        name: str,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> ReturnVoice:
        """
        Creates a new voice from a specified TTS generation ID and saves it to your **Voice Library**. This allows for consistent speech style and prosody across multiple requests.

        Parameters
        ----------
        generation_id : str
            A unique ID associated with this TTS generation that can be used as context for generating consistent speech style and prosody across multiple requests.

        name : str
            Name of the voice in the `Voice Library`.

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        ReturnVoice
            Successful Response

        Examples
        --------
        from hume import HumeClient

        client = HumeClient(
            api_key="YOUR_API_KEY",
        )
        client.tts.voices.create(
            generation_id="795c949a-1510-4a80-9646-7d0863b023ab",
            name="David Hume",
        )
        """
        _response = self._client_wrapper.httpx_client.request(
            "v0/tts/voices",
            method="POST",
            json={
                "generation_id": generation_id,
                "name": name,
            },
            headers={
                "content-type": "application/json",
            },
            request_options=request_options,
            omit=OMIT,
        )
        try:
            if 200 <= _response.status_code < 300:
                return typing.cast(
                    ReturnVoice,
                    parse_obj_as(
                        type_=ReturnVoice,  # type: ignore
                        object_=_response.json(),
                    ),
                )
            if _response.status_code == 422:
                raise UnprocessableEntityError(
                    typing.cast(
                        HttpValidationError,
                        parse_obj_as(
                            type_=HttpValidationError,  # type: ignore
                            object_=_response.json(),
                        ),
                    )
                )
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(status_code=_response.status_code, body=_response.text)
        raise ApiError(status_code=_response.status_code, body=_response_json)


class AsyncVoicesClient:
    def __init__(self, *, client_wrapper: AsyncClientWrapper):
        self._client_wrapper = client_wrapper

    async def create(
        self,
        *,
        generation_id: str,
        name: str,
        request_options: typing.Optional[RequestOptions] = None,
    ) -> ReturnVoice:
        """
        Creates a new voice from a specified TTS generation ID and saves it to your **Voice Library**. This allows for consistent speech style and prosody across multiple requests.

        Parameters
        ----------
        generation_id : str
            A unique ID associated with this TTS generation that can be used as context for generating consistent speech style and prosody across multiple requests.

        name : str
            Name of the voice in the `Voice Library`.

        request_options : typing.Optional[RequestOptions]
            Request-specific configuration.

        Returns
        -------
        ReturnVoice
            Successful Response

        Examples
        --------
        import asyncio

        from hume import AsyncHumeClient

        client = AsyncHumeClient(
            api_key="YOUR_API_KEY",
        )


        async def main() -> None:
            await client.tts.voices.create(
                generation_id="795c949a-1510-4a80-9646-7d0863b023ab",
                name="David Hume",
            )


        asyncio.run(main())
        """
        _response = await self._client_wrapper.httpx_client.request(
            "v0/tts/voices",
            method="POST",
            json={
                "generation_id": generation_id,
                "name": name,
            },
            headers={
                "content-type": "application/json",
            },
            request_options=request_options,
            omit=OMIT,
        )
        try:
            if 200 <= _response.status_code < 300:
                return typing.cast(
                    ReturnVoice,
                    parse_obj_as(
                        type_=ReturnVoice,  # type: ignore
                        object_=_response.json(),
                    ),
                )
            if _response.status_code == 422:
                raise UnprocessableEntityError(
                    typing.cast(
                        HttpValidationError,
                        parse_obj_as(
                            type_=HttpValidationError,  # type: ignore
                            object_=_response.json(),
                        ),
                    )
                )
            _response_json = _response.json()
        except JSONDecodeError:
            raise ApiError(status_code=_response.status_code, body=_response.text)
        raise ApiError(status_code=_response.status_code, body=_response_json)
