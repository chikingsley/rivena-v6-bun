# This file was auto-generated by Fern from our API Definition.

from ...core.pydantic_utilities import UniversalBaseModel
import pydantic
from .audio_encoding import AudioEncoding
import typing
from .snippet import Snippet
from ...core.pydantic_utilities import IS_PYDANTIC_V2


class ReturnGeneration(UniversalBaseModel):
    audio: str = pydantic.Field()
    """
    The generated audio output in the requested format, encoded as a base64 string.
    """

    duration: float = pydantic.Field()
    """
    Duration of the generated audio in seconds.
    """

    encoding: AudioEncoding
    file_size: int = pydantic.Field()
    """
    Size of the generated audio in bytes.
    """

    generation_id: str = pydantic.Field()
    """
    A unique ID associated with this TTS generation that can be used as context for generating consistent speech style and prosody across multiple requests.
    """

    snippets: typing.List[typing.List[Snippet]] = pydantic.Field()
    """
    A list of speech segments, each containing a portion of the original text optimized for  natural speech delivery. These segments represent the input text divided into more natural-sounding units.
    """

    if IS_PYDANTIC_V2:
        model_config: typing.ClassVar[pydantic.ConfigDict] = pydantic.ConfigDict(extra="allow", frozen=True)  # type: ignore # Pydantic v2
    else:

        class Config:
            frozen = True
            smart_union = True
            extra = pydantic.Extra.allow
